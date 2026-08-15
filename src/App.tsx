import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { FoodSpotsScreen } from './apps/food-spots/FoodSpotsScreen'
import { HomeScreen } from './hub/HomeScreen'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/food-spots" element={<FoodSpotsScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
