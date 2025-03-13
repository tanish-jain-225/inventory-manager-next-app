import { Inter } from "next/font/google";
import "./globals.css";

// Initialize the Inter font with Latin character subset
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Improves performance by allowing text to display in fallback font until Inter loads
});

/**
 * Application metadata for SEO and browser display
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 */
export const metadata = {
  title: "Inventory Management System",
  description: "Efficiently manage inventory, track stock levels, and streamline your business operations",
  keywords: "inventory management, stock tracking, business tools, product management",
  authors: [{ name: "Your Name", url: "https://yourwebsite.com" }],
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Viewport configuration
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f3f4f6", // Light gray color matching the app's UI
};

/**
 * Root layout component that wraps all pages in the application
 * Provides common HTML structure, fonts, and global styles
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to render within the layout
 * @returns {JSX.Element} HTML document structure with applied styles and metadata
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased h-full`}>
        <main className="min-h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
