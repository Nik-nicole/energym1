export interface ContentBlock {
  id: string;
  type: 'text' | 'subtitle' | 'image' | 'titulo' | 'subtitulo' | 'parrafo' | 'imagen';
  content: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontSize?: 'small' | 'medium' | 'large';
 estilo: {
    alineacion: 'left' | 'center' | 'right' | 'justify';
    color: string;
    tamaño: 'pequeño' | 'mediano' | 'grande';
  };
  imageSettings?: {
    position: 'banner' | 'left' | 'right' | 'center' | 'izquierda' | 'derecha';
    url: string;
    alt: string;
    posicion?: 'banner' | 'izquierda' | 'derecha' | 'centro' | 'sin';
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
  activo?: boolean;
  destacado?: boolean;
  imagenPosicion?: string;
}
