import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  // Add the exact same secret here so the Edge runtime knows how to read the cookie
  secret: "otso-poultry-farm-super-secret-key-2026",
});

export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|logo.png).*)"],
};
