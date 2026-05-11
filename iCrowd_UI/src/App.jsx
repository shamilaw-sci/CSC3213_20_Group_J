import { Routes, Route } from 'react-router-dom'
import Catalog from './modules/catalog/Catalog'
import ProductDetails from './modules/catalog/pages/ProductDetails'

function App() {
  return (
    <Routes>
      <Route path='/' element={<Catalog />} />
      <Route path='/product/:id' element={<ProductDetails />} />
    </Routes>
  )
}

export default App