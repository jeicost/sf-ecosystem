import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'

const rootElement = document.getElementById('root')
const tree = <BrowserRouter><App /></BrowserRouter>

if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, tree)
} else {
  ReactDOM.createRoot(rootElement).render(tree)
}
