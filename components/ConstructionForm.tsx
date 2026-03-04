"use client";

import React, { useState, useRef, ChangeEvent, FormEvent, useCallback } from 'react';
import { X, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { FormField, TextInput, RadioGroup, CheckboxGroup } from './FormComponents';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, maxImages = 10 }) => {
  const [previewUrls, setPreviewUrls] = useState<{ file: File; url: string }[]>([]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (previewUrls.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        rejected.push(`"${file.name}" — unsupported format (only JPEG, PNG, GIF, WebP allowed)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`"${file.name}" — exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      alert(`The following files were rejected:\n\n${rejected.join('\n')}`);
    }

    if (accepted.length === 0) return;

    const newPreviews = accepted.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviewUrls(prev => [...prev, ...newPreviews]);
    onImagesChange([...previewUrls.map(p => p.file), ...accepted]);
  }, [maxImages, onImagesChange, previewUrls]);

  const removeImage = useCallback((indexToRemove: number) => {
    setPreviewUrls(prev => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      onImagesChange(newPreviews.map(p => p.file));
      return newPreviews;
    });
  }, [onImagesChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {previewUrls.map((preview, index) => (
          <div key={preview.url} className="relative aspect-square">
            <div className="relative w-full h-full">
              <Image
                src={preview.url}
                alt={`Preview ${index + 1}`}
                className="object-cover rounded-lg"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {previewUrls.length < maxImages && (
          <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#D4A843] hover:bg-amber-50">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="mt-2 text-sm text-gray-500">Upload Image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-sm text-gray-500">
        Upload up to {maxImages} inspiration images (exteriors, interiors, floor plans)
      </p>
    </div>
  );
};

interface FormData {
  // Step 1 — About You
  name: string;
  email: string;
  phone: string;
  constructionBudget: string;
  propertyAddress: string;
  hasSurvey: string;
  hasSlope: string;
  padDirection: string;
  // Step 2 — The Build
  stories: string;
  aestheticStyle: string;
  houseShape: string;
  aestheticStyleCustom: string;
  living: string;
  patios: string;
  footprintPreset: string;
  footprintWidth: string;
  footprintDepth: string;
  garageCars: string;
  garageType: string;
  garageLoad: string;
  masterLocation: string;
  l2Scope: string;
  // Step 3 — Rooms
  bedrooms: string;
  fullBaths: string;
  halfBaths: string;
  desiredRooms: Record<string, boolean>;
  kitchenFeatures: Record<string, boolean>;
  kitchenLayout: string;
  masterBathroom: Record<string, boolean>;
  masterCloset: Record<string, boolean>;
  // Step 4 — Architecture
  mainRoofStyle: string;
  garageRoofStyle: string;
  hallwayType: string;
  roofPitch: string;
  greatRoomVaulted: string;
  secondaryCeilingHeight: string;
  masterCeilingHeight: string;
  fireplace: string;
  fireplaceType: Record<string, boolean>;
  porchLocations: Record<string, boolean>;
  patiosCovered: string;
  rearPatioDepth: string;
  // Step 5 — Inspiration
  additionalItems: string;
  unwantedItems: string;
  pinterestLink: string;
  inspirationImages: File[];
  floorPlanImages: File[];
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  email: '',
  phone: '',
  constructionBudget: '',
  propertyAddress: '',
  hasSurvey: '',
  hasSlope: '',
  padDirection: '',
  stories: 'single',
  aestheticStyle: '',
  aestheticStyleCustom: '',
  houseShape: '',
  living: '',
  patios: '',
  footprintPreset: '',
  footprintWidth: '',
  footprintDepth: '',
  garageCars: '2',
  garageType: 'attached',
  garageLoad: 'front-load',
  masterLocation: '',
  l2Scope: '',
  bedrooms: '',
  fullBaths: '',
  halfBaths: '',
  desiredRooms: {
    greatRoom: false,
    eatInKitchen: false,
    laundryRoom: false,
    officeStudy: false,
    golfSimulator: false,
    barWetBar: false,
    wineRoom: false,
    mediaRoom: false,
    salon: false,
    mudroom: false,
    bonusRoom: false,
    gameRoom: false,
    safeRoom: false,
    workshop: false,
    masterSeatingSpace: false,
  },
  kitchenFeatures: {
    butlerPantry: false,
    cornerPantry: false,
    kitchenIsland: false,
    breakfastBar: false,
  },
  kitchenLayout: '',
  masterBathroom: {
    walkInShower: false,
    customShowerSeat: false,
    shampooNiche: false,
    freestandingBathtub: false,
    makeupVanitySpace: false,
    chandelier: false,
  },
  masterCloset: {
    hisAndHerSpaces: false,
    oneLargeSpace: false,
    connectedToMasterBedroom: false,
    accessFromMasterBathroom: false,
    builtInDrawersAndShelving: false,
  },
  mainRoofStyle: 'gable',
  garageRoofStyle: 'match-main',
  hallwayType: '',
  roofPitch: '3:12',
  greatRoomVaulted: '',
  secondaryCeilingHeight: '10',
  masterCeilingHeight: '10',
  fireplace: '',
  fireplaceType: {
    woodBurning: false,
    electric: false,
    gasPropane: false,
  },
  porchLocations: {
    frontPorch: false,
    rearPorch: false,
    sidePorch: false,
  },
  patiosCovered: '',
  rearPatioDepth: '',
  additionalItems: '',
  unwantedItems: '',
  pinterestLink: '',
  inspirationImages: [],
  floorPlanImages: [],
};

const STEP_LABELS = ['About You', 'The Build', 'Rooms', 'Architecture', 'Inspiration'];

const ConstructionForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const formLoadedAt = useRef(Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (section: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as Record<string, boolean>),
        [field]: !(prev[section as keyof typeof prev] as Record<string, boolean>)[field],
      },
    }));
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep === 1 && (!formData.constructionBudget || formData.constructionBudget.trim() === '')) {
      alert('Please enter your construction budget');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.constructionBudget || formData.constructionBudget.trim() === '') {
      alert('Please enter your construction budget');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'inspirationImages' && key !== 'floorPlanImages') {
          fd.append(key, typeof value === 'object' && value !== null ? JSON.stringify(value) : value.toString());
        }
      });
      fd.append('_website', honeypot);
      fd.append('_loadTime', formLoadedAt.current.toString());
      formData.inspirationImages.forEach((image, index) => {
        fd.append(`inspiration_image_${index}`, image);
      });
      formData.floorPlanImages.forEach((image, index) => {
        fd.append(`floor_plan_image_${index}`, image);
      });

      const response = await fetch('/api/submit-form', { method: 'POST', body: fd });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Submission failed');

      alert('Design brief submitted! Our team will review your submission.');
      setFormData({ ...INITIAL_FORM_DATA });
      setCurrentStep(1);
      formLoadedAt.current = Date.now();
    } catch (error) {
      console.error('Submission error:', error);
      alert(error instanceof Error ? error.message : 'There was an error submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 1: About You ────────────────────────────────────────────────────

  const renderAboutYou = () => (
    <div className="space-y-6">
      <FormField label="Full Name">
        <TextInput name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Email Address">
          <TextInput name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" />
        </FormField>
        <FormField label="Phone Number">
          <TextInput name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="(555) 555-5555" />
        </FormField>
      </div>

      <FormField label="Construction Budget (not including land/site prep) *">
        <TextInput name="constructionBudget" value={formData.constructionBudget} onChange={handleInputChange} placeholder="e.g. $500,000" required />
      </FormField>

      <FormField label="Property Address (if purchased)">
        <TextInput name="propertyAddress" value={formData.propertyAddress} onChange={handleInputChange} placeholder="Street address, city, state" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Do you have a survey of the property?">
          <RadioGroup
            name="hasSurvey"
            options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
            value={formData.hasSurvey}
            onChange={handleInputChange}
          />
        </FormField>
        <FormField label="Does the property have a significant slope?">
          <RadioGroup
            name="hasSlope"
            options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
            value={formData.hasSlope}
            onChange={handleInputChange}
          />
        </FormField>
      </div>

      <FormField label="Which direction would you like the home to face?">
        <TextInput name="padDirection" value={formData.padDirection} onChange={handleInputChange} placeholder="e.g. South, Southeast" />
      </FormField>
    </div>
  );

  // ── Step 2: The Build ────────────────────────────────────────────────────

  const renderTheBuild = () => (
    <div className="space-y-6">
      <FormField label="Stories">
        <RadioGroup
          name="stories"
          options={[{ label: 'Single Story', value: 'single' }, { label: 'Two Story', value: 'two' }]}
          value={formData.stories}
          onChange={handleInputChange}
        />
      </FormField>

      <FormField label="Aesthetic Style">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: 'modern-desert', label: 'Modern Desert', desc: 'Dark steel, warm earth tones, low slope' },
            { value: 'scandinavian', label: 'Scandinavian Modern', desc: 'Dark siding, wood accents, glass gables' },
            { value: 'barndominium', label: 'Contemporary Barndominium', desc: 'Metal exterior, open concept, industrial' },
            { value: 'hill-country', label: 'Hill Country Modern', desc: 'Limestone, metal roof, Texas ranch' },
            { value: 'industrial', label: 'Industrial Modern', desc: 'Exposed steel, concrete, large windows' },
            { value: 'custom', label: 'Custom / Mixed', desc: 'Describe your vision below' },
          ].map(style => (
            <button
              key={style.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, aestheticStyle: style.value }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                formData.aestheticStyle === style.value
                  ? 'border-[#D4A843] bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900">{style.label}</div>
              <div className="text-xs text-gray-500 mt-1">{style.desc}</div>
            </button>
          ))}
        </div>
        {formData.aestheticStyle === 'custom' && (
          <textarea
            name="aestheticStyleCustom"
            className="mt-3 w-full p-3 border rounded-lg text-gray-900 text-sm"
            rows={3}
            value={formData.aestheticStyleCustom}
            onChange={handleInputChange}
            placeholder="Describe your ideal aesthetic..."
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Total Living Area (sq ft)">
          <TextInput name="living" value={formData.living} onChange={handleInputChange} placeholder="e.g. 2500" type="number" />
        </FormField>
        <FormField label="Patio Area (sq ft)">
          <TextInput name="patios" value={formData.patios} onChange={handleInputChange} placeholder="e.g. 600" type="number" />
        </FormField>
      </div>

      <FormField label="Building Footprint">
        <select
          name="footprintPreset"
          value={formData.footprintPreset}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        >
          <option value="">Select a footprint size...</option>
          <option value="compact">Compact (~40×50)</option>
          <option value="standard">Standard (~50×60)</option>
          <option value="large">Large (~60×70)</option>
          <option value="xl">XL (~70×80+)</option>
          <option value="custom">Custom dimensions</option>
        </select>
        {formData.footprintPreset === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <FormField label="Width (ft)">
              <TextInput name="footprintWidth" value={formData.footprintWidth} onChange={handleInputChange} placeholder="e.g. 55" type="number" />
            </FormField>
            <FormField label="Depth (ft)">
              <TextInput name="footprintDepth" value={formData.footprintDepth} onChange={handleInputChange} placeholder="e.g. 65" type="number" />
            </FormField>
          </div>
        )}
      </FormField>

      <FormField label="House Shape">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: 'rectangle', label: 'Simple Rectangle', desc: 'Easiest to build, most efficient' },
            { value: 'l-shape', label: 'L-Shape', desc: 'Two wings, creates courtyard nook' },
            { value: 'u-shape', label: 'U-Shape', desc: 'Three wings, wraparound courtyard' },
            { value: 't-shape', label: 'T-Shape', desc: 'Front + rear wings, adds depth' },
            { value: 'courtyard', label: 'Courtyard Wrap', desc: 'Interior courtyard focus' },
          ].map(shape => (
            <button
              key={shape.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, houseShape: shape.value }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                formData.houseShape === shape.value
                  ? 'border-[#D4A843] bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900">{shape.label}</div>
              <div className="text-xs text-gray-500 mt-1">{shape.desc}</div>
            </button>
          ))}
        </div>
      </FormField>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Garage</h3>
        <FormField label="Number of Cars">
          <RadioGroup
            name="garageCars"
            options={[
              { label: '1 Car', value: '1' },
              { label: '2 Cars', value: '2' },
              { label: '3 Cars', value: '3' },
              { label: '4+ Cars', value: '4+' },
            ]}
            value={formData.garageCars}
            onChange={handleInputChange}
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Attached or Detached?">
            <RadioGroup
              name="garageType"
              options={[{ label: 'Attached', value: 'attached' }, { label: 'Detached', value: 'detached' }]}
              value={formData.garageType}
              onChange={handleInputChange}
            />
          </FormField>
          <FormField label="Load Direction">
            <RadioGroup
              name="garageLoad"
              options={[{ label: 'Front-Load', value: 'front-load' }, { label: 'Side-Load', value: 'side-load' }]}
              value={formData.garageLoad}
              onChange={handleInputChange}
            />
          </FormField>
        </div>
      </div>

      <FormField label="Master Suite Location">
        <RadioGroup
          name="masterLocation"
          options={[
            { label: 'West End', value: 'west-end' },
            { label: 'East End', value: 'east-end' },
            { label: 'Rear Center', value: 'rear-center' },
          ]}
          value={formData.masterLocation}
          onChange={handleInputChange}
        />
      </FormField>

      {formData.stories === 'two' && (
        <FormField label="What goes upstairs?">
          <RadioGroup
            name="l2Scope"
            options={[
              { label: 'All Secondary Bedrooms', value: 'all-secondary-bedrooms' },
              { label: 'Game Room + Bedrooms', value: 'game-room-bedrooms' },
              { label: 'Bonus Rooms Only', value: 'bonus-rooms-only' },
            ]}
            value={formData.l2Scope}
            onChange={handleInputChange}
          />
        </FormField>
      )}
    </div>
  );

  // ── Step 3: Rooms ────────────────────────────────────────────────────────

  const renderRooms = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Bedrooms">
          <TextInput name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} type="number" placeholder="e.g. 4" />
        </FormField>
        <FormField label="Full Bathrooms">
          <TextInput name="fullBaths" value={formData.fullBaths} onChange={handleInputChange} type="number" placeholder="e.g. 3" />
        </FormField>
        <FormField label="Half Bathrooms">
          <TextInput name="halfBaths" value={formData.halfBaths} onChange={handleInputChange} type="number" placeholder="e.g. 1" />
        </FormField>
      </div>

      <FormField label="Desired Rooms / Spaces">
        <CheckboxGroup
          section="desiredRooms"
          options={[
            { label: 'Great Room', value: 'greatRoom' },
            { label: 'Eat-In Kitchen', value: 'eatInKitchen' },
            { label: 'Laundry Room', value: 'laundryRoom' },
            { label: 'Office / Study', value: 'officeStudy' },
            { label: 'Golf Simulator', value: 'golfSimulator' },
            { label: 'Bar / Wet Bar', value: 'barWetBar' },
            { label: 'Wine Room', value: 'wineRoom' },
            { label: 'Media Room', value: 'mediaRoom' },
            { label: 'Salon', value: 'salon' },
            { label: 'Mudroom', value: 'mudroom' },
            { label: 'Bonus Room', value: 'bonusRoom' },
            { label: 'Game Room', value: 'gameRoom' },
            { label: 'Safe Room', value: 'safeRoom' },
            { label: 'Workshop', value: 'workshop' },
            { label: 'Master Seating Space', value: 'masterSeatingSpace' },
          ]}
          values={formData.desiredRooms}
          onChange={handleCheckboxChange}
        />
      </FormField>

      <FormField label="Kitchen Features">
        <CheckboxGroup
          section="kitchenFeatures"
          options={[
            { label: 'Butler Pantry', value: 'butlerPantry' },
            { label: 'Corner Pantry', value: 'cornerPantry' },
            { label: 'Kitchen Island', value: 'kitchenIsland' },
            { label: 'Breakfast Bar', value: 'breakfastBar' },
          ]}
          values={formData.kitchenFeatures}
          onChange={handleCheckboxChange}
        />
      </FormField>

      <FormField label="Kitchen Layout">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: 'l-shape', label: 'L-Shape', desc: 'Two walls, open corner' },
            { value: 'galley', label: 'Galley', desc: 'Two parallel walls, efficient flow' },
            { value: 'u-shape', label: 'U-Shape', desc: 'Three walls, max storage' },
            { value: 'one-wall', label: 'One Wall', desc: 'Linear, fully open plan' },
            { value: 'island', label: 'Island Focus', desc: 'Island as primary workspace' },
          ].map(layout => (
            <button
              key={layout.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, kitchenLayout: layout.value }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                formData.kitchenLayout === layout.value
                  ? 'border-[#D4A843] bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900">{layout.label}</div>
              <div className="text-xs text-gray-500 mt-1">{layout.desc}</div>
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Master Bathroom Features">
        <CheckboxGroup
          section="masterBathroom"
          options={[
            { label: 'Walk-In Shower', value: 'walkInShower' },
            { label: 'Custom Shower Seat', value: 'customShowerSeat' },
            { label: 'Shampoo Niche', value: 'shampooNiche' },
            { label: 'Freestanding Bathtub', value: 'freestandingBathtub' },
            { label: 'Makeup Vanity Space', value: 'makeupVanitySpace' },
            { label: 'Chandelier', value: 'chandelier' },
          ]}
          values={formData.masterBathroom}
          onChange={handleCheckboxChange}
        />
      </FormField>

      <FormField label="Master Closet">
        <CheckboxGroup
          section="masterCloset"
          options={[
            { label: 'His & Hers Spaces', value: 'hisAndHerSpaces' },
            { label: 'One Large Space', value: 'oneLargeSpace' },
            { label: 'Connected to Master Bedroom', value: 'connectedToMasterBedroom' },
            { label: 'Access From Master Bathroom', value: 'accessFromMasterBathroom' },
            { label: 'Built-In Drawers & Shelving', value: 'builtInDrawersAndShelving' },
          ]}
          values={formData.masterCloset}
          onChange={handleCheckboxChange}
        />
      </FormField>
    </div>
  );

  // ── Step 4: Architecture ─────────────────────────────────────────────────

  const renderArchitecture = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Main House Roof">
          <RadioGroup
            name="mainRoofStyle"
            options={[
              { label: 'Gable', value: 'gable' },
              { label: 'Single Slope', value: 'single-slope' },
              { label: 'Flat', value: 'flat' },
              { label: 'Parapet Wall', value: 'parapet-wall' },
            ]}
            value={formData.mainRoofStyle}
            onChange={handleInputChange}
          />
        </FormField>
        <FormField label="Garage/Wing Roof">
          <RadioGroup
            name="garageRoofStyle"
            options={[
              { label: 'Gable', value: 'gable' },
              { label: 'Single Slope', value: 'single-slope' },
              { label: 'Flat', value: 'flat' },
              { label: 'Match Main', value: 'match-main' },
            ]}
            value={formData.garageRoofStyle}
            onChange={handleInputChange}
          />
        </FormField>
      </div>

      <FormField label="Roof Pitch">
        <RadioGroup
          name="roofPitch"
          options={[
            { label: '1:12', value: '1:12' },
            { label: '3:12', value: '3:12' },
            { label: '6:12', value: '6:12' },
            { label: '8:12', value: '8:12' },
          ]}
          value={formData.roofPitch}
          onChange={handleInputChange}
        />
        <div className="mt-2">
          <RadioGroup
            name="roofPitch"
            options={[{ label: '10:12', value: '10:12' }]}
            value={formData.roofPitch}
            onChange={handleInputChange}
          />
        </div>
      </FormField>

      <FormField label="Hallway Type">
        <RadioGroup
          name="hallwayType"
          options={[
            { label: 'Open Plan', value: 'open-plan' },
            { label: 'Single Corridor', value: 'single-corridor' },
            { label: 'Double-Loaded Corridor', value: 'double-loaded' },
            { label: 'Gallery Hall', value: 'gallery' },
          ]}
          value={formData.hallwayType}
          onChange={handleInputChange}
        />
      </FormField>

      <FormField label="Vaulted ceiling in the great room?">
        <RadioGroup
          name="greatRoomVaulted"
          options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
          value={formData.greatRoomVaulted}
          onChange={handleInputChange}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Secondary Ceiling Height">
          <RadioGroup
            name="secondaryCeilingHeight"
            options={[
              { label: '9 ft', value: '9' },
              { label: '10 ft', value: '10' },
              { label: '11 ft', value: '11' },
              { label: '12 ft', value: '12' },
            ]}
            value={formData.secondaryCeilingHeight}
            onChange={handleInputChange}
          />
        </FormField>
        <FormField label="Master Ceiling Height">
          <RadioGroup
            name="masterCeilingHeight"
            options={[
              { label: '10 ft', value: '10' },
              { label: '11 ft', value: '11' },
              { label: '12 ft', value: '12' },
            ]}
            value={formData.masterCeilingHeight}
            onChange={handleInputChange}
          />
        </FormField>
      </div>

      <FormField label="Fireplace">
        <RadioGroup
          name="fireplace"
          options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
          value={formData.fireplace}
          onChange={handleInputChange}
        />
      </FormField>

      {formData.fireplace === 'yes' && (
        <FormField label="Fireplace Type">
          <CheckboxGroup
            section="fireplaceType"
            options={[
              { label: 'Wood Burning', value: 'woodBurning' },
              { label: 'Electric', value: 'electric' },
              { label: 'Gas / Propane', value: 'gasPropane' },
            ]}
            values={formData.fireplaceType}
            onChange={handleCheckboxChange}
          />
        </FormField>
      )}

      <FormField label="Porch Locations">
        <CheckboxGroup
          section="porchLocations"
          options={[
            { label: 'Front', value: 'frontPorch' },
            { label: 'Rear', value: 'rearPorch' },
            { label: 'Side', value: 'sidePorch' },
          ]}
          values={formData.porchLocations}
          onChange={handleCheckboxChange}
        />
      </FormField>

      <FormField label="Covered Patios?">
        <RadioGroup
          name="patiosCovered"
          options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
          value={formData.patiosCovered}
          onChange={handleInputChange}
        />
      </FormField>

      <FormField label="Rear Covered Patio Depth (ft)">
        <TextInput name="rearPatioDepth" value={formData.rearPatioDepth} onChange={handleInputChange} placeholder="e.g. 12" type="number" />
      </FormField>
    </div>
  );

  // ── Step 5: Inspiration ──────────────────────────────────────────────────

  const renderInspiration = () => (
    <div className="space-y-8">
      <FormField label="Are there any items or spaces not covered above that you'd like in your home?">
        <textarea
          name="additionalItems"
          className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-[#D4A843] focus:border-[#D4A843] text-gray-900 placeholder-gray-500"
          rows={4}
          value={formData.additionalItems}
          onChange={handleInputChange}
          placeholder="Anything else you'd like us to know..."
        />
      </FormField>

      <FormField label="Are there any specific items you DO NOT want in your home?">
        <textarea
          name="unwantedItems"
          className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-[#D4A843] focus:border-[#D4A843] text-gray-900 placeholder-gray-500"
          rows={4}
          value={formData.unwantedItems}
          onChange={handleInputChange}
          placeholder="Items or features to avoid..."
        />
      </FormField>

      <FormField label="Pinterest Board Link">
        <p className="text-sm text-gray-600 mb-2">Share a board with your vision — exteriors, interiors, floor plans, kitchens, etc.</p>
        <TextInput name="pinterestLink" value={formData.pinterestLink} onChange={handleInputChange} placeholder="https://pinterest.com/..." />
      </FormField>

      <FormField label="Floor Plan Inspiration">
        <p className="text-sm text-gray-600 mb-3">Upload floor plans you like — layouts, room arrangements, flow patterns. Our AI will study the spatial logic.</p>
        <ImageUpload
          onImagesChange={(images) => setFormData(prev => ({ ...prev, floorPlanImages: images }))}
          maxImages={10}
        />
      </FormField>

      <FormField label="Upload Inspiration Images">
        <p className="text-sm text-gray-600 mb-3">Photos of homes, interiors, or details that inspire you. Our AI will analyze these to understand your vision.</p>
        <ImageUpload
          onImagesChange={(images) => setFormData(prev => ({ ...prev, inspirationImages: images }))}
          maxImages={10}
        />
      </FormField>
    </div>
  );

  // ── Step router ──────────────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderAboutYou();
      case 2: return renderTheBuild();
      case 3: return renderRooms();
      case 4: return renderArchitecture();
      case 5: return renderInspiration();
      default: return renderAboutYou();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Card className="mx-auto border-none rounded-none sm:rounded-lg sm:my-4 sm:mx-4 shadow-none sm:shadow-sm">
        <CardHeader className="border-b space-y-4 px-4 py-6 sm:px-6 bg-black">
          <div className="flex flex-col items-center">
            <div className="relative h-12 w-40 sm:h-16 sm:w-48">
              <Image
                src="https://hbfjdfxephlczkfgpceg.supabase.co/storage/v1/object/public/website/logos/logo1.png"
                alt="Barnhaus Steel Builders Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="text-center mt-4">
              <CardTitle className="text-2xl sm:text-3xl text-white">Design Brief</CardTitle>
              <p className="mt-2 text-sm text-gray-300">
                Tell us about your dream steel home
              </p>
            </div>
          </div>

          <div className="w-full mt-6">
            <div className="flex space-x-1 sm:space-x-2 overflow-x-auto px-1 py-2">
              {STEP_LABELS.map((step, index) => (
                <button
                  key={step}
                  onClick={(e) => { e.preventDefault(); setCurrentStep(index + 1); }}
                  className={`flex-none px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
                    currentStep === index + 1
                      ? 'bg-[#D4A843] text-black font-medium'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
            <div className="mt-4 h-1.5 bg-gray-700 rounded-full">
              <div
                className="h-full bg-[#D4A843] rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pb-24 sm:p-6 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
              <label htmlFor="_website">Website</label>
              <input type="text" id="_website" name="_website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            <div className="space-y-6">{renderStepContent()}</div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 sm:relative sm:bg-transparent sm:border-t-0 sm:p-0 sm:mt-6">
              <div className="flex justify-between max-w-4xl mx-auto">
                {currentStep > 1 && (
                  <button type="button" onClick={handlePreviousStep} className="px-5 py-2.5 bg-gray-500 text-white rounded-full text-sm font-medium hover:bg-gray-600 transition-colors">
                    Previous
                  </button>
                )}
                {currentStep < 5 ? (
                  <button type="button" onClick={handleNextStep} className="px-5 py-2.5 bg-[#D4A843] text-black rounded-full text-sm font-medium hover:bg-amber-500 transition-colors ml-auto">
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2.5 text-white rounded-full text-sm font-medium transition-colors ml-auto ${
                      isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Design Brief'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConstructionForm;
