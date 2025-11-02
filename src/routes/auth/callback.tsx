import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { exchangeCodeForToken } from "../../lib/github-service";
import { useAuthStore } from "../../stores/auth";
import type { User } from "../../stores/auth";

export const Route = createFileRoute("/auth/callback")({
  component: Callback,
});

export default function Callback() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (!code) {
      navigate({ to: "/login" });
      return;
    }

    async function handleCallback(authCode: string) {
      try {
        const token = await exchangeCodeForToken(authCode);
        const user: User = {
          email: "", // Will be fetched from GitHub API in GitHubService
          provider: "github",
          token,
        };
        login(user);
        navigate({ to: "/editor" });
      } catch (error) {
        console.error("Authentication failed:", error);
        navigate({ to: "/login" });
      }
    }

    handleCallback(code);
  }, [code, navigate, login]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <p>Please wait while we complete your authentication</p>
      </div>
    </div>
  );
}
