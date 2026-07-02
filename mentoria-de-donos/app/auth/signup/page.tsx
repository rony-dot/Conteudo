import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
