import { SignIn } from "@clerk/nextjs";
import AnimatedCharactersLoginPage from "@/components/ui/animated-characters-login-page";

export default function SignInPage() {
  return (
    <AnimatedCharactersLoginPage>
      <div className="relative mx-auto w-full max-w-md">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#4338ca",
              colorBackground: "rgba(255,255,255,0.94)",
              colorInputBackground: "#f8fafc",
              colorInputText: "#0f172a",
              colorText: "#0f172a",
              colorNeutral: "#000000",
              borderRadius: "16px",
              spacingUnit: "10px",
              fontFamily: "var(--font-geist-sans)",
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            },
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-none border-0 bg-white/90 backdrop-blur rounded-2xl ring-1 ring-gray-100 p-6",
              headerTitle: "text-base font-semibold text-gray-900",
              headerSubtitle: "text-sm text-gray-600",
              formFieldLabel: "hidden",
              formFieldInput:
                "bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
              socialButtonsBlockButton:
                "border border-gray-200 bg-white text-gray-900 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm text-base font-semibold",
              socialButtonsBlockButton__google:
                "bg-white text-gray-900 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm text-base font-semibold",
              socialButtonsBlockButtonText: "text-gray-900 font-semibold",
              socialButtonsBlockButtonIcon: "text-gray-900",
              formButtonPrimary:
                "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg hover:shadow-indigo-200",
              footer: "!hidden",
              footerAction: "!hidden",
              footerActionText: "!hidden",
              footerActionLink: "!hidden",
              identityPreviewEditButton: "hidden",
            },
          }}
        />
      </div>
    </AnimatedCharactersLoginPage>
  );
}
