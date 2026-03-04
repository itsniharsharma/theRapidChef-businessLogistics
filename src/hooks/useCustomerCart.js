import { useContext } from 'react'
import { CustomerCartContext } from '../context/CustomerCartContext'

export function useCustomerCart() {
  return useContext(CustomerCartContext)
}