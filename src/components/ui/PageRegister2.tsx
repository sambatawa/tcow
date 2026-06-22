"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash, FaSpinner, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import { glassBlock, lbl, inputClass, buttonClass } from "@/lib/styles";
import { PasswordChecksList } from "@/components/auth/PasswordChecksList";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {  getPasswordChecks,isPasswordValid,isValidEmailFormat,MSG} from "@/lib/validation";

interface PageRegister2Props {
  onBack: () => void;
  onSubmit: (data: { name: string; email: string; password: string; confirm: string }) => void;
  loading: boolean;
  farmCode: string;
}

export default function PageRegister2({ onBack, onSubmit, loading, farmCode }: PageRegister2Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordChecks = getPasswordChecks(form.password);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nama lengkap wajib diisi.";
    if (!form.email.trim()) errs.email = MSG.emailRequired;
    else if (!isValidEmailFormat(form.email)) errs.email = MSG.emailInvalid;
    if (!form.password) errs.password = MSG.passwordRequired;
    else if (!isPasswordValid(form.password)) errs.password = MSG.passwordInvalid;
    if (!form.confirm) errs.confirm = "Konfirmasi password wajib diisi.";
    else if (form.confirm !== form.password) errs.confirm = MSG.passwordMismatch;
    return errs;
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);
    onSubmit(form);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-brand-forest dark:text-brand-cream text-2xl font-bold tracking-tight">
          Daftar Akun
        </h1>
        <p className="text-brand-sage dark:text-brand-tan/90 mt-2 text-sm leading-relaxed">
          Lengkapi informasi akun Anda untuk menyelesaikan pendaftaran.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className={`${glassBlock} ${errors.name ? "border-red-300/70 dark:border-red-500/40" : ""}`}>
            <label className={lbl} htmlFor="reg-name">Nama lengkap</label>
            <input id="reg-name" type="text" autoComplete="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Sesuai identitas Anda" className={inputClass} />
          </div>
          {errors.name && (
            <p className="flex items-center gap-1.5 mt-2 text-[13px] text-red-600 dark:text-red-400 px-1">
              <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <div className={`${glassBlock} ${errors.email ? "border-red-300/70 dark:border-red-500/40" : ""}`}>
            <label className={lbl} htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" autoComplete="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="nama@email.com" className={inputClass} />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1.5 mt-2 text-[13px] text-red-600 dark:text-red-400 px-1">
              <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className={`${glassBlock} ${errors.password ? "border-red-300/70 dark:border-red-500/40" : ""}`}>
              <label className={lbl} htmlFor="reg-pass">Password</label>
              <div className="relative flex items-center">
                <input id="reg-pass" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Min. 5 karakter" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 p-1 text-brand-sage hover:text-brand-forest dark:text-brand-tan">
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1.5 mt-2 text-[13px] text-red-600 dark:text-red-400 px-1">
                <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <div className={`${glassBlock} ${errors.confirm ? "border-red-300/70 dark:border-red-500/40" : ""}`}>
              <label className={lbl} htmlFor="reg-confirm">Konfirmasi</label>
              <div className="relative flex items-center">
                <input id="reg-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" value={form.confirm} onChange={(e) => handleChange("confirm", e.target.value)} placeholder="Ulangi password" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-0 p-1 text-brand-sage hover:text-brand-forest dark:text-brand-tan">
                  {showConfirm ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {errors.confirm && (
              <p className="flex items-center gap-1.5 mt-2 text-[13px] text-red-600 dark:text-red-400 px-1">
                <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
                {errors.confirm}
              </p>
            )}
          </div>
        </div>

        {form.password ? (
          <PasswordChecksList checks={passwordChecks} variant="register" />
        ) : null}

        <label className="flex items-start gap-3 px-1 py-2 cursor-pointer">
          <input type="checkbox" id="terms" required className="w-4 h-4 mt-0.5 rounded border-brand-forest/35 text-brand-forest shrink-0" />
          <span className="text-[13px] text-brand-sage dark:text-brand-tan leading-relaxed">
            Saya setuju syarat pemakaian dan privasi data.
          </span>
        </label>

        <button type="submit" className={buttonClass} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <FaSpinner className="w-4 h-4 animate-spin" />
              Menyimpan
            </span>
          ) : (
            "Buat akun"
          )}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-forest/10 dark:border-brand-cream/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 text-brand-sage dark:text-brand-tan">atau</span>
          </div>
        </div>

        <GoogleSignInButton
          label="Daftar dengan Google"
          mode="register"
          farmCode={farmCode}
          disabled={loading}
        />
      </form>

      <p className="text-center text-sm text-brand-sage dark:text-brand-tan">
        Sudah punya akun?{" "}
        <a href="/login" className="text-brand-forest dark:text-brand-accent font-semibold hover:underline">
          Masuk
        </a>
      </p>

      <button onClick={onBack} className="flex gap-2 text-brand-sage dark:text-brand-tan hover:text-brand-forest dark:hover:text-brand-cream mb-4">
        <FaArrowLeft className="w-4 h-4" />
        <span className="text-sm">Kembali</span>
      </button>
    </div>
  );
}
