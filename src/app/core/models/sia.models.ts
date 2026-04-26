// ─── Archivo / Storage ───────────────────────────────────────────────────────
export interface ArchivoResponse {
    id: string;
    nombreOriginal: string;
    mimeType: string;
    tamanoBytes: number;
    extension: string;
    categoria: string;
    visibilidad: string;
    url: string;
    modulo: string;
    entidad: string;
    idEntidad: string;
    tipoReferencia: string;
    esPrincipal: boolean;
    creadoEn: string;
}

// ─── Configuración Institución ──────────────────────────────────────────────
export interface ConfiguracionInstitucionRequest {
    clave: string;
    valor: string;
    tipoValor?: string;
    descripcion?: string;
}

export interface ConfiguracionInstitucionResponse {
    id: string;
    idInstitucion: string;
    clave: string;
    valor: string;
    tipoValor: string;
    descripcion?: string;
}

// ─── Curso-Materia ────────────────────────────────────────────────────────────
export interface CursoMateriaRequest {
    idMateria: string;
}

export interface CursoMateriaResponse {
    id: string;
    idInstitucion: string;
    idCurso: string;
    idMateria: string;
    estado: string;
    creadoEn: string;
}

// ─── Instituciones ───────────────────────────────────────────────────────────
export interface InstitucionRequest {
    codigo?: string;
    nombre: string;
    tipoInstitucion?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
}

export interface InstitucionResponse {
    id: string;
    codigo?: string;
    nombre: string;
    tipoInstitucion?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    estado: string;
    creadoEn: string;
    actualizadoEn?: string;
}

// ─── Usuarios ────────────────────────────────────────────────────────────────
export interface UsuarioResponse {
    id: string;
    correo: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    idInstitucion?: string;
    roles: string[];
    estado: string;
    creadoEn: string;
}

export interface ActualizarUsuarioRequest {
    nombres: string;
    apellidos: string;
    telefono?: string;
}

export interface CrearUsuarioRequest {
    correo: string;
    contrasena: string;
    nombres: string;
    apellidos: string;
    idInstitucion?: string;
    codigoRol?: string;
}

export interface AsignarRolRequest {
    codigoRol: string;
}

// ─── Gestión Académica ───────────────────────────────────────────────────────
export interface GestionAcademicaRequest {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    activa?: boolean;
}

export interface GestionAcademicaResponse {
    id: string;
    idInstitucion: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    activa: boolean;
    estado: string;
    creadoEn: string;
}

// ─── Cursos ──────────────────────────────────────────────────────────────────
export interface CursoRequest {
    codigo: string;
    nombre: string;
    nivel?: string;
}

export interface CursoResponse {
    id: string;
    idInstitucion: string;
    codigo: string;
    nombre: string;
    nivel?: string;
    estado: string;
}

// ─── Paralelos ───────────────────────────────────────────────────────────────
export interface ParaleloRequest {
    idCurso: string;
    idGestion: string;
    nombre: string;
    capacidad?: number;
}

export interface ParaleloResponse {
    id: string;
    idInstitucion: string;
    idCurso: string;
    idGestion: string;
    nombre: string;
    capacidad?: number;
    estado: string;
}

// ─── Materias ────────────────────────────────────────────────────────────────
export interface MateriaRequest {
    codigo: string;
    nombre: string;
    area?: string;
    cargaHoraria?: number;
}

export interface MateriaResponse {
    id: string;
    idInstitucion: string;
    codigo: string;
    nombre: string;
    area?: string;
    cargaHoraria?: number;
    estado: string;
}

// ─── Docentes ────────────────────────────────────────────────────────────────
export interface DocenteRequest {
    codigo: string;
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    correo: string;
    especialidad?: string;
}

export interface DocenteResponse {
    id: string;
    idInstitucion: string;
    codigo: string;
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    correo: string;
    especialidad?: string;
    estado: string;
}

// ─── Estudiantes ─────────────────────────────────────────────────────────────
export interface EstudianteRequest {
    codigoEstudiante: string;
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento?: string;
    sexo?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
}

export interface EstudianteResponse {
    id: string;
    idInstitucion: string;
    codigoEstudiante: string;
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento?: string;
    sexo?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    estado: string;
}

// ─── Tutores ─────────────────────────────────────────────────────────────────
export interface TutorRequest {
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
}

export interface TutorResponse {
    id: string;
    idInstitucion: string;
    idUsuario?: string;
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    estado: string;
    creadoEn?: string;
    actualizadoEn?: string;
}

// body para POST /api/estudiantes/{id}/tutores
export interface TutorEstudianteRequest {
    idTutor: string;
    parentesco?: string;
    esPrincipal?: boolean;
}

export interface TutorEstudianteResponse {
    id: string;
    idInstitucion: string;
    idEstudiante: string;
    idTutor: string;
    parentesco?: string;
    esPrincipal: boolean;
    estado: string;
    creadoEn: string;
}

// ─── Inscripciones ───────────────────────────────────────────────────────────
export interface InscripcionRequest {
    idEstudiante: string;
    idGestion: string;
    idCurso: string;
    idParalelo: string;
}

export interface InscripcionResponse {
    id: string;
    idInstitucion: string;
    idEstudiante: string;
    idGestion: string;
    idCurso: string;
    idParalelo: string;
    fechaInscripcion?: string;
    estado: string;
    creadoEn: string;
}

// ─── Asignaciones Docentes ───────────────────────────────────────────────────
export interface AsignacionDocenteRequest {
    idDocente: string;
    idMateria: string;
    idParalelo: string;
    idGestion: string;
}

export interface AsignacionDocenteResponse {
    id: string;
    idInstitucion: string;
    idDocente: string;
    idMateria: string;
    idParalelo: string;
    idGestion: string;
    estado: string;
    creadoEn: string;
}
