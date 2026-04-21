import "../styles/globals.scss";
import NavBarWrapper from "@/components/NavBar/NavBarWrapper";

export const metadata = {
  title: "EduPlatform — منصة التعلم العربية",
  description: "تعلّم من أفضل الخبراء العرب",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <NavBarWrapper />
        {children}
      </body>
    </html>
  );
}