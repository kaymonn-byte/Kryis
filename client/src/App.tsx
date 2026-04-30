import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import DailyReports from "./pages/DailyReports";
import Notes from "./pages/Notes";
import TickerDetail from "./pages/TickerDetail";
import Insights from "./pages/Insights";
import ChatKryis from "./pages/ChatKryis";
import Operations from "./pages/Operations";
import Scanner from "./pages/Scanner";
import FiscalPanel from "./pages/FiscalPanel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/insights" component={Insights} />
      <Route path="/chat" component={ChatKryis} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/reports" component={DailyReports} />
      <Route path="/notes" component={Notes} />
      <Route path="/operations" component={Operations} />
      <Route path="/fiscal" component={FiscalPanel} />
      <Route path="/ticker/:ticker" component={TickerDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
