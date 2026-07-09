import Header from "./Header";
import Footer from "./Footer";
import AppRouter from "../router/AppRouter";

export default function AppShell() {
  return (
    <>
      <Header />
      <main className="container" id="app">
        <AppRouter />
      </main>
      <Footer />
    </>
  );
}
