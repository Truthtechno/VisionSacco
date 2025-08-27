import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";

interface LoginPageProps {
  onSuccess: (user: any) => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [isSignupMode, setIsSignupMode] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isSignupMode ? (
          <SignupForm
            onSuccess={onSuccess}
            onToggleMode={() => setIsSignupMode(false)}
          />
        ) : (
          <LoginForm
            onSuccess={onSuccess}
            onToggleMode={() => setIsSignupMode(true)}
          />
        )}
      </div>
    </div>
  );
}