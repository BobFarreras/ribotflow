/**
 * Creation/modification date: 11/06/2026
 * Path: src/components/sat/clients/ContactList.tsx
 * Description: Client contacts list with add/edit/delete functionality.
 *              Each action is automatic via Server Actions.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { User, Phone, Mail, Pencil, Trash2, BadgeCheck, Plus, Loader2 } from "lucide-react";
import { getContactsAction, deleteContactAction } from "@/actions/sat/clients/manageContacts";
import { ContactFormModal } from "./ContactFormModal";

interface Contact {
  id: string;
  clientId: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactListProps {
  clientId: string;
}

export function ContactList({ clientId }: ContactListProps) {
  const t = useTranslations("sat.clients.form");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    const result = await getContactsAction(clientId);
    if (result.success && result.data) {
      setContacts(result.data as Contact[]);
    }
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAdd = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!window.confirm(t("contactDeleteConfirm"))) return;

    setDeletingId(contactId);
    const result = await deleteContactAction(contactId);
    setDeletingId(null);

    if (result.success) {
      fetchContacts();
    }
  };

  const handleSaved = () => {
    fetchContacts();
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[var(--module-sat)]" />
          <span className="text-sm font-semibold text-[var(--text)]">
            {t("contactSectionTitle")} ({contacts.length})
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
        >
          <Plus className="h-3 w-3" />
          {t("contactNew")}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : contacts.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--text-muted)]">{t("contactEmpty")}</p>
      ) : (
        <div className="space-y-2 pt-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {contact.isPrimary && (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                    )}
                    <span className="truncate text-sm font-medium text-[var(--text)]">
                      {contact.name}
                    </span>
                  </div>
                  {contact.position && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{contact.position}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(contact)}
                    className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id)}
                    disabled={deletingId === contact.id}
                    className="rounded p-1 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingId === contact.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                {contact.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="hover:text-[var(--module-sat)] hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="hover:text-[var(--module-sat)] hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ContactFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingContact(null);
        }}
        clientId={clientId}
        contact={editingContact}
        onSaved={handleSaved}
      />
    </>
  );
}
