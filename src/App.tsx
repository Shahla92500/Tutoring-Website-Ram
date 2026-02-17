import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import AppShell from "./layout/AppShell";

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
