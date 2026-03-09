"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import loginBackground from "../../../public/mysoceitybg.jpg";
import { useLoginMutation } from "@/lib/features/auth/authApi";
import { useAppSelector } from "@/lib/hooks";
import { auth } from "../../../firebase";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

type MessageState = {
  type: "error" | "success";
  text: string;
} | null;

export default function SignInPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [message, setMessage] = useState<MessageState>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const provider = new GoogleAuthProvider();

  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/portal");
    }
  }, [isAuthenticated, router]);

  const completeBackendLogin = async (token: string) => {
    const response = await login({ firebaseToken: token }).unwrap();
    localStorage.setItem(
      "authData",
      JSON.stringify({
        token,
        user: response.user ?? null,
      })
    );
    setMessage({ type: "success", text: "Login successful. Redirecting..." });
    router.push("/portal");
  };

  const handleEmailPasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      await completeBackendLogin(token);
    } catch {
      setMessage({ type: "error", text: "Invalid email or password." });
    }
  };

  const handleGoogleLogin = async () => {
    setMessage(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      await completeBackendLogin(token);
    } catch (error) {
      const text =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof error.data === "object" &&
        error.data !== null &&
        "message" in error.data &&
        typeof error.data.message === "string"
          ? error.data.message
          : "Login failed. Please try again.";

      setMessage({ type: "error", text });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${loginBackground.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-[90%] max-w-md text-center">
        <h2 className="text-2xl font-semibold text-rose-500 mb-6">Log In</h2>

        <form onSubmit={handleEmailPasswordLogin} className="space-y-4 mb-4">
          <div className="text-left">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600 bg-transparent text-gray-700"
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600 bg-transparent text-gray-700"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 ${
              isLoading ? "bg-rose-300 cursor-not-allowed" : "bg-rose-400 hover:bg-rose-500"
            } text-white py-2 rounded-lg font-medium transition`}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="my-4 text-sm text-slate-500">OR</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`w-full flex justify-center items-center gap-2 ${
            isLoading ? "bg-rose-300 cursor-not-allowed" : "bg-rose-400 hover:bg-rose-500"
          } text-white py-2 rounded-lg font-medium transition`}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Signing In...
            </>
          ) : (
            "Sign In with Google"
          )}
        </button>

        {message && (
          <div
            className={`mt-4 p-2 rounded-md text-sm font-medium ${
              message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-sm mt-4 text-gray-700">
          Register route is not enabled in backend yet.{" "}
          <Link href="/register" className="text-rose-600 hover:underline">
            Details
          </Link>
        </p>
      </div>
    </div>
  );
}
