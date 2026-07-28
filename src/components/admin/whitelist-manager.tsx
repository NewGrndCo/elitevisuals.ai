import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "./use-admin";
import {
  EmptyState,
  Field,
  PrimaryButton,
  SectionHeader,
  TextInput,
  useConfirm,
} from "./primitives";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The old version managed its own useState + manual refetch, so it never
 *  shared the query cache and had no loading or error states. */
function useWhitelist() {
  return useQuery({
    queryKey: ["admin_whitelist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_whitelist")
        .select("email")
        .order("email");
      if (error) throw error;
      return (data ?? []) as { email: string }[];
    },
  });
}

export function WhitelistManager() {
  const { data: emails, isLoading, error } = useWhitelist();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [newEmail, setNewEmail] = useState("");

  const invalid = newEmail.trim() !== "" && !EMAIL_RE.test(newEmail.trim());

  const addMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error: err } = await supabase.from("admin_whitelist").insert({ email });
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Added — they become an admin on their next sign-in");
      setNewEmail("");
      qc.invalidateQueries({ queryKey: ["admin_whitelist"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const removeMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error: err } = await supabase.from("admin_whitelist").delete().eq("email", email);
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["admin_whitelist"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const add = () => {
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    addMutation.mutate(email);
  };

  const remove = async (email: string) => {
    const ok = await confirm({
      title: "Remove admin access?",
      body: `${email} will lose admin privileges on their next sign-in.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) removeMutation.mutate(email);
  };

  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="Admin whitelist"
        desc="Emails here are granted the admin role automatically when they next sign in."
      />

      <div className="glass mt-6 rounded-2xl p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field
            label="Email address"
            error={invalid ? "That doesn't look like a valid email." : null}
          >
            <div className="glass flex items-center gap-2 rounded-xl px-3">
              <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !invalid && add()}
                placeholder="email@studio.com"
                inputMode="email"
                autoComplete="off"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </Field>
          <div className="flex items-start sm:pt-[26px]">
            <PrimaryButton
              onClick={add}
              loading={addMutation.isPending}
              disabled={!newEmail.trim() || invalid}
              className="w-full sm:w-auto"
            >
              <ShieldCheck className="h-4 w-4" /> Add admin
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading && (
          <div className="glass h-12 animate-pulse rounded-xl" aria-label="Loading admins" />
        )}
        {error && (
          <p className="rounded-xl border border-destructive/40 px-4 py-3 text-sm text-destructive">
            Couldn't load the whitelist: {friendlyError(error)}
          </p>
        )}
        {!isLoading && !error && emails?.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title="No admins whitelisted"
            desc="Add an email above so that account gets admin rights on next sign-in."
          />
        )}
        {emails?.map((e) => (
          <div
            key={e.email}
            className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" />
              <span className="truncate">{e.email}</span>
            </span>
            <button
              onClick={() => remove(e.email)}
              disabled={removeMutation.isPending}
              aria-label={`Remove ${e.email}`}
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
