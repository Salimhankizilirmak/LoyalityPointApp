import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>
      <div className="relative z-10">
        <SignUp appearance={{ elements: { formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-sm normal-case' } }} />
      </div>
    </div>
  );
}
