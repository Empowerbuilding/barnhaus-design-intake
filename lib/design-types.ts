export type Style = 'hill_country' | 'modern_farmhouse' | 'industrial' | 'contemporary'
export type Shape = 'rectangle' | 'l-shape' | 't-shape' | 'u-shape' | 'courtyard' | 'h-shape' | 'z-shape' | 'wide-shallow' | 'narrow-deep'
export type Direction = 'N' | 'S' | 'E' | 'W'
export type GarageCount = 'none' | '1-car' | '2-car' | '3-car'
export type GarageAttachment = 'attached_left' | 'attached_right' | 'detached'
export type GarageOrientation = 'front_facing' | 'side_loaded'

export type Priority = 'master_privacy' | 'open_living' | 'outdoor_connection' | 'garage_access' | 'home_office'

export type MasterLocation = 'far_left' | 'far_right' | 'rear_center' | 'front_center' | 'no_preference'
export type ClosetConfig = 'single_wic' | 'his_and_hers' | 'no_preference'
export type BathConfig = 'ensuite_each' | 'shared_hall' | 'jack_and_jill' | 'mix'

export interface MasterSuite {
  location?: MasterLocation
  closet_config?: ClosetConfig
  has_freestanding_tub?: boolean
  has_walk_in_shower?: boolean
  outdoor_access?: boolean
}

export interface Lifestyle {
  has_pets?: boolean
  pet_wash_station?: boolean
  vehicle_count?: number
  has_workshop?: boolean
  has_ev_charging?: boolean
  entertaining_priority?: 'low' | 'medium' | 'high'
  wfh_days?: 'never' | 'sometimes' | 'always'
  kids_at_home?: boolean
  multigenerational?: boolean
}

export interface Features {
  covered_back_porch: boolean
  covered_front_porch: boolean
  screened_porch: boolean
  vaulted_great_room: boolean
  butler_pantry: boolean
  mudroom: boolean
  home_office: boolean
  media_room: boolean
  inlaw_suite: boolean
  safe_room: boolean
  outdoor_kitchen: boolean
}

export interface LotData {
  lot_address?: string
  lot_lat?: number
  lot_lng?: number
  lot_size_acres?: number
  lot_parcel_id?: string
  lot_boundary_geojson?: object
  house_rotation_deg?: number
  street_facing?: string
  garage_facing?: string
  driveway_approach?: string
  lot_flags?: string[]
  lot_notes?: string
}

export interface Architecture {
  wall_height?: 'standard' | 'tall' | 'dramatic'
  zone_heights?: Record<string, number>
  window_style?: 'fixed' | 'awning' | 'casement' | 'floor-to-ceiling'
  exterior_material?: 'board-batten' | 'metal-panels' | 'stucco' | 'brick' | 'mixed'
}

export interface DesignState {
  sessionId?: string
  step: number
  style?: Style
  sqft?: number
  bedrooms?: number
  bathrooms?: number
  fullBaths?: number
  halfBaths?: number
  bathConfig?: BathConfig
  shape?: Shape
  streetFacing?: Direction
  viewFacing?: Direction
  priorities?: Priority[]
  garageCount?: GarageCount
  garageAttachment?: GarageAttachment
  garageOrientation?: GarageOrientation
  stories?: 1 | 2
  features?: Partial<Features>
  masterSuite?: Partial<MasterSuite>
  lifestyle?: Partial<Lifestyle>
  architecture?: Architecture
  lot?: Partial<LotData>
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
