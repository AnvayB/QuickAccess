import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DrinksScreen } from './apps/drinks/DrinksScreen'
import { FoodSpotsScreen } from './apps/food-spots/FoodSpotsScreen'
import { MorningCalculatorScreen } from './apps/morning-calculator/MorningCalculatorScreen'
import { HomeScreen } from './hub/HomeScreen'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/food-spots" element={<FoodSpotsScreen />} />
        <Route path="/drinks" element={<DrinksScreen />} />
        <Route path="/morning-calculator" element={<MorningCalculatorScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
