/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/hooks/useQuoteForm.ts
 * Description: All form state, calculations and handlers for the quote editor.
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createQuoteAction } from "@/actions/sat/createQuote";
import { updateQuoteAction } from "@/actions/sat/updateQuote";
import { toast } from "sonner";
import type {
  Client,
  Product,
  QuoteItemForm,
  ExistingQuote,
} from "../types";

const DEFAULT_VALIDITY_DAYS = 30;

const DEFAULT_DESCRIPTION = `Descripcio del treball a realitzar:

• Revisio i diagnostic de l'estat actual
• Execucio de les obres segons normativa vigent
• Proves de funcionament i qualitat
• Neteja final de la zona d'intervencio
• Lliurament de documentacio tecnica i garanties`;

const DEFAULT_CONDITIONS = `Condicions generals i forma de pagament:

• Forma de pagament: Transferencia bancaria al compte indicat.
• Metode de pagament: 50% en efectuar la comanda com a paga i senyal, i el 50% restant al lliurament final i conformitat dels treballs.
• Preus: Aquests preus no inclouen IVA llevat que s'indiqui expressament.
• Validesa: Aquest pressupost es valid durant ${DEFAULT_VALIDITY_DAYS} dies a partir de la data d'emissio.
• Garantia: Els treballs disposen de garantia segons legislacio vigent.
• Modificacions: Qualsevol variacio respecte al pressupost inicial sera comunicada previament per escrit.`;

function getDefaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + DEFAULT_VALIDITY_DAYS);
  return date.toISOString().split("T")[0];
}

export interface UseQuoteFormProps {
  workOrderId: string;
  clients: Client[];
  products: Product[];
  workOrders?: Array<{ id: string; number: string; title: string }>;
  existingQuote?: ExistingQuote;
  mode?: "create" | "edit";
}

export interface UseQuoteFormReturn {
  // State
  isLoading: boolean;
  error: string | null;
  view: "split" | "editor" | "preview";
  workOrderId: string;
  showEmailModal: boolean;
  selectedClientId: string;
  customClient: { name: string; email: string; phone: string; address: string; taxId: string };
  useCustomClient: boolean;
  formData: {
    description: string;
    validUntil: string;
    taxRate: number;
    discountPercent: number;
    clientNotes: string;
  };
  items: QuoteItemForm[];
  productSearch: string;
  showProductPicker: number | null;

  // Derived
  selectedClient: Client | undefined;
  filteredProducts: Product[];
  subtotal: number;
  generalDiscount: number;
  subtotalAfterDiscount: number;
  taxAmount: number;
  total: number;

  // Handlers
  setView: (v: "split" | "editor" | "preview") => void;
  setShowEmailModal: (v: boolean) => void;
  setWorkOrderId: (v: string) => void;
  handleClientSelect: (clientId: string) => void;
  setUseCustomClient: (v: boolean) => void;
  setCustomClient: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; address: string; taxId: string }>>;
  setFormData: React.Dispatch<React.SetStateAction<{ description: string; validUntil: string; taxRate: number; discountPercent: number; clientNotes: string }>>;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof QuoteItemForm, value: any) => void;
  selectProduct: (index: number, product: Product) => void;
  setProductSearch: (v: string) => void;
  setShowProductPicker: (v: number | null) => void;
  getUnitStep: (unit: string) => string;
  calculateItemTotal: (item: QuoteItemForm) => number;
  handleSubmit: () => Promise<void>;
  setError: (v: string | null) => void;
  routerBack: () => void;
}

export function useQuoteForm(props: UseQuoteFormProps): UseQuoteFormReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"split" | "editor" | "preview">("split");
  const [workOrderId, setWorkOrderId] = useState(props.workOrderId);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Client state
  const [selectedClientId, setSelectedClientId] = useState<string>(
    props.existingQuote?.clientId ?? ""
  );
  const [customClient, setCustomClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
  });
  const [useCustomClient, setUseCustomClient] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: props.existingQuote?.description ?? DEFAULT_DESCRIPTION,
    validUntil: props.existingQuote?.validUntil?.split("T")[0] ?? getDefaultValidUntil(),
    taxRate: Number(props.existingQuote?.taxRate ?? 21),
    discountPercent: Number(props.existingQuote?.discountPercent ?? 0),
    clientNotes: props.existingQuote?.clientNotes ?? DEFAULT_CONDITIONS,
  });

  // Items
  const [items, setItems] = useState<QuoteItemForm[]>(
    props.existingQuote?.items?.length
      ? props.existingQuote.items.map((item, index) => ({
          id: item.id,
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          unitCost: item.unitCost ? Number(item.unitCost) : null,
          discountPercent: Number(item.discountPercent),
          discountAmount: Number(item.discountAmount),
          category: item.category as QuoteItemForm["category"],
          sortOrder: item.sortOrder ?? index,
        }))
      : [
          {
            productId: null,
            description: "",
            quantity: 1,
            unit: "unit",
            unitPrice: 0,
            unitCost: null,
            discountPercent: 0,
            discountAmount: 0,
            category: "material",
            sortOrder: 0,
          },
        ]
  );

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState<number | null>(null);

  /* ---------- Calculations ---------- */
  const calculateItemTotal = useCallback((item: QuoteItemForm) => {
    const subtotal = item.quantity * item.unitPrice;
    const discount =
      item.discountAmount > 0
        ? item.discountAmount
        : (subtotal * item.discountPercent) / 100;
    return subtotal - discount;
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
    [items, calculateItemTotal]
  );

  const generalDiscount = useMemo(
    () => (subtotal * formData.discountPercent) / 100,
    [subtotal, formData.discountPercent]
  );

  const subtotalAfterDiscount = useMemo(
    () => subtotal - generalDiscount,
    [subtotal, generalDiscount]
  );

  const taxAmount = useMemo(
    () => (subtotalAfterDiscount * formData.taxRate) / 100,
    [subtotalAfterDiscount, formData.taxRate]
  );

  const total = useMemo(() => subtotalAfterDiscount + taxAmount, [subtotalAfterDiscount, taxAmount]);

  /* ---------- Client ---------- */
  const selectedClient = useMemo(
    () => props.clients.find((c) => c.id === selectedClientId),
    [props.clients, selectedClientId]
  );

  const handleClientSelect = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setUseCustomClient(false);
    const client = props.clients.find((c) => c.id === clientId);
    if (client) {
      setCustomClient({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
        taxId: client.taxId ?? "",
      });
    }
  }, [props.clients]);

  /* ---------- Items ---------- */
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        productId: null,
        description: "",
        quantity: 1,
        unit: "unit",
        unitPrice: 0,
        unitCost: null,
        discountPercent: 0,
        discountAmount: 0,
        category: "material" as const,
        sortOrder: prev.length,
      },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const updateItem = useCallback((index: number, field: keyof QuoteItemForm, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, []);

  const selectProduct = useCallback((index: number, product: Product) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        description: product.name,
        unitPrice: Number(product.unitPrice ?? 0),
        unitCost: product.unitCost ? Number(product.unitCost) : null,
      };
      return newItems;
    });
    setShowProductPicker(null);
    setProductSearch("");
  }, []);

  const filteredProducts = useMemo(
    () =>
      props.products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku?.toLowerCase().includes(productSearch.toLowerCase())
      ),
    [props.products, productSearch]
  );

  const getUnitStep = useCallback(
    (unit: string) =>
      [
        { value: "unit", step: "1" },
        { value: "kg", step: "0.01" },
        { value: "g", step: "0.01" },
        { value: "m", step: "0.01" },
        { value: "m2", step: "0.01" },
        { value: "m3", step: "0.01" },
        { value: "l", step: "0.01" },
        { value: "h", step: "0.5" },
        { value: "day", step: "0.5" },
        { value: "pack", step: "1" },
      ].find((u) => u.value === unit)?.step ?? "1",
    []
  );

  /* ---------- Submit ---------- */
  const handleSubmit = useCallback(async () => {
    const validItems = items.filter((item) => item.description);
    if (validItems.length === 0) {
      setError("Ha d'haver almenys una linia");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      workOrderId: workOrderId || null,
      clientId: useCustomClient ? "00000000-0000-0000-0000-000000000000" : selectedClientId,
      title: `${useCustomClient ? customClient.name : selectedClient?.name ?? "Pressupost"} - ${new Date().toLocaleDateString("ca-ES")}`,
      description: formData.description || null,
      validUntil: formData.validUntil || null,
      taxRate: formData.taxRate,
      discountPercent: formData.discountPercent,
      notes: null,
      clientNotes: formData.clientNotes || null,
      items: validItems.map((item, index) => ({ ...item, sortOrder: index })),
    };

    const result =
      props.mode === "edit" && props.existingQuote
        ? await updateQuoteAction(props.existingQuote.id, payload)
        : await createQuoteAction(payload);

    setIsLoading(false);

    if (result.success && result.data) {
      toast.success(props.mode === "edit" ? "Pressupost actualitzat!" : "Pressupost creat!");
      if (props.mode === "create") {
        setTimeout(() => {
          router.push(`/sat/quotes/${result.data.id}`);
        }, 1000);
      }
    } else {
      setError(result.error ?? "Error");
    }
  }, [items, workOrderId, useCustomClient, selectedClientId, customClient, selectedClient, formData, props.mode, props.existingQuote, router]);

  return {
    isLoading,
    error,
    view,
    workOrderId,
    showEmailModal,
    selectedClientId,
    customClient,
    useCustomClient,
    formData,
    items,
    productSearch,
    showProductPicker,
    selectedClient,
    filteredProducts,
    subtotal,
    generalDiscount,
    subtotalAfterDiscount,
    taxAmount,
    total,
    setView,
    setShowEmailModal,
    setWorkOrderId,
    handleClientSelect,
    setUseCustomClient,
    setCustomClient,
    setFormData,
    addItem,
    removeItem,
    updateItem,
    selectProduct,
    setProductSearch,
    setShowProductPicker,
    getUnitStep,
    calculateItemTotal,
    handleSubmit,
    setError,
    routerBack: () => router.back(),
  };
}
