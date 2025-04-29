import { useEffect, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'

export default function App() {
 
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}
