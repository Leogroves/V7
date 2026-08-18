"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/cloud";

export default function AccountPanel({
  onAuthChange
}: {
  onAuthChange?: (signedIn: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"offline" | "signedout" | "signedin">("offline");
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("offline");
      onAuthChange?.(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentEmail(data.user.email || "");
        setStatus("signedin");
        onAuthChange?.(true);
      } else {
        setStatus("signedout");
        onAuthChange?.(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const signedIn = !!session?.user;
      setStatus(signedIn ? "signedin" : "signedout");
      setCurrentEmail(session?.user?.email || "");
      onAuthChange?.(signedIn);
    });

    return () => listener.subscription.unsubscribe();
  }, [onAuthChange]);

  async function signIn() {
    const supabase = getSupabase();
    if (!supabase || !email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
      }
    });

    if (!error) alert("Check your email for a sign-in link.");
    else alert(error.message);
  }

  async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <section className="accountPanel">
      <div>
        <span className="eyebrow">ACCOUNT</span>
        <h2>Take your trips everywhere</h2>
        <p>
          Sign in to sync favorites, visited places, bucket lists and road trips across devices.
        </p>
      </div>

      {status === "offline" ? (
        <div className="cloudNotice">
          <strong>Cloud sync isn’t configured yet.</strong>
          <span>Add the Supabase environment values, run the included schema, and this screen becomes live.</span>
        </div>
      ) : status === "signedin" ? (
        <div className="signedInBox">
          <div>
            <strong>Signed in</strong>
            <span>{currentEmail}</span>
          </div>
          <button onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <div className="signInBox">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={signIn}>Send sign-in link</button>
        </div>
      )}
    </section>
  );
}
