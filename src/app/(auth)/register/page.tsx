"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import PageRegister1 from "@/components/ui/PageRegister1";
import PageRegister2 from "@/components/ui/PageRegister2";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [farmCode, setFarmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, verifyKode } = useAuth();
  const router = useRouter();

  const handleCodeVerification = async (code: string) => {
    setLoading(true);
    const result = await verifyKode(code);
    setLoading(false);

    if (!result.valid) {
      toast.error(result.error ?? "No kode tidak valid");
      return;
    }

    setFarmCode(code.trim().toUpperCase());
    setStep(2);
    toast.success("No kode berhasil diverifikasi");
  };

  const handleRegistration = async (data: {
    name: string;
    email: string;
    password: string;
    confirm: string;
  }) => {
    setLoading(true);
    const result = await register({
      no_kode: farmCode,
      name: data.name,
      email: data.email,
      password: data.password,
    });
    setLoading(false);

    if (result.success && result.needsVerification && result.email) {
      toast.success("Kode verifikasi dikirim ke email Anda.");
      router.push(
        `/verify-email?email=${encodeURIComponent(result.email)}`
      );
    } else if (result.success) {
      router.push("/login");
    } else {
      toast.error(result.error ?? "Gagal mendaftarkan akun");
    }
  };

  const handleBack = () => {
    setStep(1);
    setFarmCode("");
  };

  return (
    <>
      {step === 1 ? (
        <PageRegister1 onNext={handleCodeVerification} loading={loading} />
      ) : (
        <PageRegister2
          onBack={handleBack}
          onSubmit={handleRegistration}
          loading={loading}
          farmCode={farmCode}
        />
      )}
    </>
  );
}
