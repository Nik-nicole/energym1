export interface ContentBlock {
  id: string;
  type: 'text' | 'subtitle' | 'image';
  content: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontSize?: 'small' | 'medium' | 'large';
  imageSettings?: {
    position: 'banner' | 'left' | 'right' | 'center';
    url: string;
    alt: string;
  };
}

export interface NoticiaFormData {
  titulo: string;
  resumen: string;
  imagen: string;
  esPromocion: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  sedeId?: string;
  contenido: ContentBlock[];
}
