import Banner from "@/components/layouts/Banner";
import LoginForm from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen">
      <Banner>
        <LoginForm />
      </Banner>
    </main>
  );
}
