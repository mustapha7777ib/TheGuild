import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Eye from "../images/eye.svg";
import ClosedEye from "../images/closedeye.svg";

function SignUp() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleNextStep(e) {
    e.preventDefault();
    const { email, firstName, lastName } = formData;
    if (!email || !firstName || !lastName) {
      setMessage("Please fill in all fields.");
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email.");
      return;
    }
    setMessage("");
    setStep(2);
  }

  function handleFinalSubmit(e) {
    e.preventDefault();
    const { password, confirmPassword } = formData;
    if (!password || !confirmPassword) {
      setMessage("Please enter and confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    fetch("http://localhost:8080/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, step: "verify" }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
        } else {
          setMessage("A verification code has been sent to your email.");
          setStep(3);
        }
      })
      .catch((err) => setMessage("Error: " + err.message));
  }

  function handleVerifyCode(e) {
    e.preventDefault();
    const { verificationCode } = formData;
    if (!verificationCode) {
      setMessage("Please enter the verification code.");
      return;
    }

    fetch("http://localhost:8080/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, verificationCode }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
        } else {
          login(data.user);
          navigate("/");
        }
      })
      .catch((err) => setMessage("Error: Unable to verify."));
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF9F6]">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 items-center justify-center">
        <div 
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=1000')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative z-10 text-center p-12">
          <h1 className="text-5xl font-serif text-white mb-4">The Guild</h1>
          <p className="text-amber-500 uppercase tracking-[0.4em] text-xs font-bold">The Guild of Masters</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-serif text-stone-900 tracking-tight">Create an Account</h2>
            {/* Step Indicator */}
            <div className="flex gap-2 mt-4 justify-center lg:justify-start">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1 w-12 transition-all duration-500 ${step >= s ? 'bg-amber-600' : 'bg-stone-200'}`} />
              ))}
            </div>
          </div>

          {message && (
            <div className="p-4 text-xs bg-stone-100 border-l-2 border-amber-600 text-stone-600">
              {message}
            </div>
          )}

          <div className="space-y-4">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                <input
                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 focus:ring-0 outline-none rounded-sm transition-all"
                  placeholder="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 outline-none rounded-sm"
                    placeholder="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <input
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 outline-none rounded-sm"
                    placeholder="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
                <button 
                  onClick={handleNextStep}
                  className="w-full py-4 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-all"
                >
                  Continue to Credentials
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 outline-none rounded-sm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <img
                    src={showPassword ? ClosedEye : Eye}
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 cursor-pointer"
                    alt="Toggle"
                  />
                </div>

                <div className="relative">
                  <input
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 outline-none rounded-sm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <img
                    src={showConfirmPassword ? ClosedEye : Eye}
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 cursor-pointer"
                    alt="Toggle"
                  />
                </div>
                <button 
                  onClick={handleFinalSubmit}
                  className="w-full py-4 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-all"
                >
                  Send Verification Code
                </button>
                <button onClick={() => setStep(1)} className="w-full text-xs text-stone-400 uppercase tracking-widest hover:text-stone-600">Back</button>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4 text-center">
                <p className="text-sm text-stone-500 mb-4">A code has been sent to <span className="text-stone-900 font-medium">{formData.email}</span></p>
                <input
                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 outline-none rounded-sm text-center text-2xl tracking-[0.5em] font-serif"
                  placeholder="000000"
                  name="verificationCode"
                  maxLength={6}
                  value={formData.verificationCode}
                  onChange={handleChange}
                />
                <button 
                  onClick={handleVerifyCode}
                  className="w-full py-4 bg-amber-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-all"
                >
                  Complete Enrollment
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-stone-500 pt-6">
            Already part of the guild?{" "}
            <Link to="/signin" className="text-amber-700 font-bold hover:text-amber-800 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;