"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import loginBackground from "../../../public/mysoceitybg.jpg";
import { useRegisterMutation } from "@/lib/features/auth/authApi";
import { useAppSelector } from "@/lib/hooks";

type MessageState = {
  type: "error" | "success";
  text: string;
} | null;

export default function RegisterPage() {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentRole = String(currentUser?.role ?? "").toUpperCase();
  const isSocietyAdmin = currentRole === "SOCIETY_ADMIN";
  const isSuperAdmin = currentRole === "SUPER_ADMIN";

  const [registerUser, { isLoading }] = useRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "SOCIETY_ADMIN" | "MEMBER">("MEMBER");
  const [societyId, setSocietyId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState<MessageState>(null);

  const effectiveSocietyIdRequired = useMemo(() => {
    if (isSocietyAdmin) {
      return true;
    }
    return role !== "SUPER_ADMIN";
  }, [isSocietyAdmin, role]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const rawPhone = phone.replace(/\D/g, "");
    const normalizedPhone =
      rawPhone.length > 10 && rawPhone.startsWith("91")
        ? rawPhone.slice(2)
        : rawPhone;

    const resolvedSocietyId = isSocietyAdmin
      ? Number(currentUser?.societyId)
      : societyId
        ? Number(societyId)
        : undefined;

    if (effectiveSocietyIdRequired && !resolvedSocietyId) {
      setMessage({ type: "error", text: "Society ID is mandatory for this role." });
      return;
    }

    try {
      await registerUser({
        name,
        email,
        password,
        phone: normalizedPhone || undefined,
        role: isSocietyAdmin ? "MEMBER" : role,
        societyId: resolvedSocietyId,
        isActive,
      }).unwrap();

      setMessage({ type: "success", text: "User registered successfully." });
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setSocietyId("");
      setRole("MEMBER");
      setIsActive(true);

      if (!currentUser) {
        router.push("/signin");
      }
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
          : "Registration failed.";
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
        <h2 className="text-2xl font-semibold text-rose-500 mb-6">Register User</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={isSocietyAdmin ? "MEMBER" : role}
              onChange={(e) => setRole(e.target.value as "SUPER_ADMIN" | "SOCIETY_ADMIN" | "MEMBER")}
              disabled={isSocietyAdmin}
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
            >
              {isSocietyAdmin ? null : <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
              {isSocietyAdmin ? null : <option value="SOCIETY_ADMIN">SOCIETY_ADMIN</option>}
              <option value="MEMBER">MEMBER</option>
            </select>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium mb-1">
              Society ID {effectiveSocietyIdRequired ? "*" : "(Optional)"}
            </label>
            <input
              type="number"
              value={isSocietyAdmin ? String(currentUser?.societyId ?? "") : societyId}
              onChange={(e) => setSocietyId(e.target.value)}
              disabled={isSocietyAdmin}
              required={effectiveSocietyIdRequired && !isSocietyAdmin}
              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
            />
          </div>

          <label className="flex items-center gap-3 text-left text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            Active User
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded-lg font-medium text-white ${
              isLoading ? "bg-rose-300 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

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
          Back to{" "}
          <Link href="/signin" className="text-rose-600 hover:underline">
            Sign in
          </Link>
        </p>

        {isSuperAdmin ? (
          <p className="text-xs mt-2 text-slate-500">For SUPER_ADMIN, society ID is optional.</p>
        ) : null}
      </div>
    </div>
  );
}
