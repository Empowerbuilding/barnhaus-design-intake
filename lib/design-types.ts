export type Style = 'hill_country' | 'modern_farmhouse' | 'industrial' | 'contemporary'
export type Shape = 'rectangle' | 'l-shape' | 't-shape' | 'u-shape' | 'courtyard'
export type Direction = 'N' | 'S' | 'E' | 'W'
export type GarageCount = 'none' | '1-car' | '2-car' | '3-car'
export type GarageAttachment = 'attached_left' | 'attached_right' | 'detached'

export type Priority = 'master_privacy' | 'open_living' | 'outdoor_connection' | 'garage_access' | 'home_office'

export interface Features {
  covered_back_porch: boolean
  covered_front_porch: boolean
  vaulted_great_room: boolean
  butler_pantry: boolean
  mudroom: boolean
  home_office: boolean
  media_room: boolean
  inlaw_suite: boolean
  safe_room: boolean
  outdoor_kitchen: boolean
}

export interface DesignState {
  sessionId?: string
  step: number
  style?: Style
  sqft?: number
  bedrooms?: number
  bathrooms?: number
  shape?: Shape
  streetFacing?: Direction
  viewFacing?: Direction
  priorities?: Priority[]
  garageCount?: GarageCount
  garageAttachment?: GarageAttachment
  stories?: 1 | 2
  features?: Partial<Features>
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export interface Room {
  id: string
  label: string
  sqft: number
  x: number
  y: number
  width: number
  height: number
  type: 'living' | 'kitchen' | 'dining' | 'bedroom' | 'master' | 'bath' | 'garage' | 'porch' | 'office' | 'laundry' | 'closet' | 'other'
}

export interface FloorPlanLayout {
  rooms: Room[]
  footprintWidth: number
  footprintDepth: number
  totalSqft: number
  viewportWidth: number
  viewportHeight: number
  scale: number
}

export interface DesignSession {
  id: string
  created_at: string
  updated_at: string
  step: number
  status: 'in_progress' | 'submitted' | 'approved' | 'built' | 'delivered'
  style?: Style
  sqft_min?: number
  sqft_max?: number
  bedrooms?: number
  bathrooms?: number
  shape?: Shape
  orientation?: Direction
  priorities?: Priority[]
  garage?: GarageCount
  garage_size?: GarageAttachment
  features?: Partial<Features>
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  layout_state?: FloorPlanLayout
  notes?: string
}
