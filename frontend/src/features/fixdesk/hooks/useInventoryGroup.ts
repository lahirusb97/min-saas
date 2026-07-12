import { useParams } from 'react-router-dom'
import { INVENTORY_GROUPS, type InventoryGroupSlug } from '../types'

export function useInventoryGroup() {
  const { slug } = useParams<{ slug: string }>()
  return slug && slug in INVENTORY_GROUPS ? INVENTORY_GROUPS[slug as InventoryGroupSlug] : null
}
