import {Navigate,Route,Routes} from "react-router-dom";
import GiveawayHome from "./pages/Giveaway/GiveawayHome";
import GiveawayDetails from "./pages/Giveaway/GiveawayDetails";
import LoginPage from "./pages/Giveaway/LoginPage";
export default function App(){return <Routes><Route path="/" element={<Navigate to="/giveaway" replace/>}/><Route path="/giveaway" element={<GiveawayHome/>}/><Route path="/giveaway/:slug" element={<GiveawayDetails/>}/><Route path="/login" element={<LoginPage/>}/><Route path="*" element={<Navigate to="/giveaway" replace/>}/></Routes>}
