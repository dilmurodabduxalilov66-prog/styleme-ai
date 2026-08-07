import { Schema, Document, model } from 'mongoose';

// ============================================================================
// 1. BARBER PORTFOLIO SCHEMA
// ============================================================================

export interface IPortfolioImage {
  image_url: string;
  title?: string;
  tags?: string[];
  uploaded_at: Date;
}

export interface IBarberPortfolio extends Document {
  barber_id: string; // UUID string matching PostgreSQL user_id
  images: IPortfolioImage[];
  created_at: Date;
  updated_at: Date;
}

export const PortfolioImageSchema = new Schema<IPortfolioImage>({
  image_url: { type: String, required: true },
  title: { type: String, required: false },
  tags: { type: [String], default: [] },
  uploaded_at: { type: Date, default: Date.now }
});

export const BarberPortfolioSchema = new Schema<IBarberPortfolio>({
  barber_id: { type: String, required: true, unique: true, index: true },
  images: { type: [PortfolioImageSchema], default: [] }
}, {
  timestamps: true
});

export const BarberPortfolio = model<IBarberPortfolio>('BarberPortfolio', BarberPortfolioSchema);

// ============================================================================
// 2. CLIENT DOSSIER SCHEMA (CRM HISTORIES)
// ============================================================================

export interface IDossierNote {
  note_text: string;
  guard_sizes_used?: string;
  haircut_date: Date;
  created_at: Date;
}

export interface IClientDossier extends Document {
  client_id: string; // UUID string matching PostgreSQL client user_id
  barber_id: string; // UUID string matching PostgreSQL barber user_id
  face_shape_profile?: string; // Oval, Diamond, etc.
  hair_density?: string; // Thick, Thin, etc.
  hair_texture?: string; // Curly, Wavy, Straight
  approved_tryon_image_url?: string; // S3 preview image reference from AI try-on
  notes: IDossierNote[];
  created_at: Date;
  updated_at: Date;
}

export const DossierNoteSchema = new Schema<IDossierNote>({
  note_text: { type: String, required: true },
  guard_sizes_used: { type: String, required: false },
  haircut_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

export const ClientDossierSchema = new Schema<IClientDossier>({
  client_id: { type: String, required: true, index: true },
  barber_id: { type: String, required: true, index: true },
  face_shape_profile: { type: String, required: false },
  hair_density: { type: String, required: false },
  hair_texture: { type: String, required: false },
  approved_tryon_image_url: { type: String, required: false },
  notes: { type: [DossierNoteSchema], default: [] }
}, {
  timestamps: true
});

// Compound index to quickly fetch client logs for a specific barber
ClientDossierSchema.index({ client_id: 1, barber_id: 1 }, { unique: true });

export const ClientDossier = model<IClientDossier>('ClientDossier', ClientDossierSchema);
