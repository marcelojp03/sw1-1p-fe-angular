import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
    GestionAcademicaRequest, GestionAcademicaResponse,
    CursoRequest, CursoResponse,
    CursoMateriaRequest, CursoMateriaResponse,
    ParaleloRequest, ParaleloResponse,
    MateriaRequest, MateriaResponse,
    DocenteRequest, DocenteResponse,
    EstudianteRequest, EstudianteResponse,
    TutorRequest, TutorResponse,
    TutorEstudianteRequest, TutorEstudianteResponse,
    InscripcionRequest, InscripcionResponse,
    AsignacionDocenteRequest, AsignacionDocenteResponse,
} from '../models/sia.models';

@Injectable({ providedIn: 'root' })
export class SiaService {
    private http = inject(HttpClient);
    private base = environment.api.baseUrl;

    // ─── Gestiones ───────────────────────────────────────────────────────────
    listarGestiones(): Observable<ApiResponse<GestionAcademicaResponse[]>> {
        return this.http.get<ApiResponse<GestionAcademicaResponse[]>>(`${this.base}/gestiones`);
    }
    crearGestion(body: GestionAcademicaRequest): Observable<ApiResponse<GestionAcademicaResponse>> {
        return this.http.post<ApiResponse<GestionAcademicaResponse>>(`${this.base}/gestiones`, body);
    }
    actualizarGestion(id: string, body: GestionAcademicaRequest): Observable<ApiResponse<GestionAcademicaResponse>> {
        return this.http.put<ApiResponse<GestionAcademicaResponse>>(`${this.base}/gestiones/${id}`, body);
    }
    eliminarGestion(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/gestiones/${id}`);
    }

    // ─── Cursos ──────────────────────────────────────────────────────────────
    listarCursos(): Observable<ApiResponse<CursoResponse[]>> {
        return this.http.get<ApiResponse<CursoResponse[]>>(`${this.base}/cursos`);
    }
    crearCurso(body: CursoRequest): Observable<ApiResponse<CursoResponse>> {
        return this.http.post<ApiResponse<CursoResponse>>(`${this.base}/cursos`, body);
    }
    actualizarCurso(id: string, body: CursoRequest): Observable<ApiResponse<CursoResponse>> {
        return this.http.put<ApiResponse<CursoResponse>>(`${this.base}/cursos/${id}`, body);
    }
    eliminarCurso(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/cursos/${id}`);
    }

    // ─── Cursos-Materias ────────────────────────────────────────────────
    listarMateriasCurso(idCurso: string): Observable<ApiResponse<CursoMateriaResponse[]>> {
        return this.http.get<ApiResponse<CursoMateriaResponse[]>>(`${this.base}/cursos/${idCurso}/materias`);
    }
    asignarMateriaCurso(idCurso: string, body: CursoMateriaRequest): Observable<ApiResponse<CursoMateriaResponse>> {
        return this.http.post<ApiResponse<CursoMateriaResponse>>(`${this.base}/cursos/${idCurso}/materias`, body);
    }
    desasignarMateriaCurso(idCurso: string, idMateria: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/cursos/${idCurso}/materias/${idMateria}`);
    }

    // --- Paralelos ---
    listarParalelos(idCurso?: string): Observable<ApiResponse<ParaleloResponse[]>> {
        const params = idCurso ? `?idCurso=${idCurso}` : '';
        return this.http.get<ApiResponse<ParaleloResponse[]>>(`${this.base}/paralelos${params}`);
    }
    crearParalelo(body: ParaleloRequest): Observable<ApiResponse<ParaleloResponse>> {
        return this.http.post<ApiResponse<ParaleloResponse>>(`${this.base}/paralelos`, body);
    }
    actualizarParalelo(id: string, body: ParaleloRequest): Observable<ApiResponse<ParaleloResponse>> {
        return this.http.put<ApiResponse<ParaleloResponse>>(`${this.base}/paralelos/${id}`, body);
    }
    eliminarParalelo(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/paralelos/${id}`);
    }

    // ─── Materias ────────────────────────────────────────────────────────────
    listarMaterias(): Observable<ApiResponse<MateriaResponse[]>> {
        return this.http.get<ApiResponse<MateriaResponse[]>>(`${this.base}/materias`);
    }
    crearMateria(body: MateriaRequest): Observable<ApiResponse<MateriaResponse>> {
        return this.http.post<ApiResponse<MateriaResponse>>(`${this.base}/materias`, body);
    }
    actualizarMateria(id: string, body: MateriaRequest): Observable<ApiResponse<MateriaResponse>> {
        return this.http.put<ApiResponse<MateriaResponse>>(`${this.base}/materias/${id}`, body);
    }
    eliminarMateria(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/materias/${id}`);
    }

    // ─── Docentes ────────────────────────────────────────────────────────────
    listarDocentes(): Observable<ApiResponse<DocenteResponse[]>> {
        return this.http.get<ApiResponse<DocenteResponse[]>>(`${this.base}/docentes`);
    }
    crearDocente(body: DocenteRequest): Observable<ApiResponse<DocenteResponse>> {
        return this.http.post<ApiResponse<DocenteResponse>>(`${this.base}/docentes`, body);
    }
    actualizarDocente(id: string, body: DocenteRequest): Observable<ApiResponse<DocenteResponse>> {
        return this.http.put<ApiResponse<DocenteResponse>>(`${this.base}/docentes/${id}`, body);
    }
    eliminarDocente(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/docentes/${id}`);
    }

    // ─── Estudiantes ─────────────────────────────────────────────────────────
    listarEstudiantes(): Observable<ApiResponse<EstudianteResponse[]>> {
        return this.http.get<ApiResponse<EstudianteResponse[]>>(`${this.base}/estudiantes`);
    }
    crearEstudiante(body: EstudianteRequest): Observable<ApiResponse<EstudianteResponse>> {
        return this.http.post<ApiResponse<EstudianteResponse>>(`${this.base}/estudiantes`, body);
    }
    actualizarEstudiante(id: string, body: EstudianteRequest): Observable<ApiResponse<EstudianteResponse>> {
        return this.http.put<ApiResponse<EstudianteResponse>>(`${this.base}/estudiantes/${id}`, body);
    }
    eliminarEstudiante(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/estudiantes/${id}`);
    }

    // ─── Tutores ─────────────────────────────────────────────────────────────
    listarTutores(): Observable<ApiResponse<TutorResponse[]>> {
        return this.http.get<ApiResponse<TutorResponse[]>>(`${this.base}/tutores`);
    }
    crearTutor(body: TutorRequest): Observable<ApiResponse<TutorResponse>> {
        return this.http.post<ApiResponse<TutorResponse>>(`${this.base}/tutores`, body);
    }
    actualizarTutor(id: string, body: TutorRequest): Observable<ApiResponse<TutorResponse>> {
        return this.http.put<ApiResponse<TutorResponse>>(`${this.base}/tutores/${id}`, body);
    }
    eliminarTutor(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/tutores/${id}`);
    }
    vincularTutorEstudiante(idEstudiante: string, body: TutorEstudianteRequest): Observable<ApiResponse<TutorEstudianteResponse>> {
        return this.http.post<ApiResponse<TutorEstudianteResponse>>(`${this.base}/estudiantes/${idEstudiante}/tutores`, body);
    }
    listarVinculosEstudiante(idEstudiante: string): Observable<ApiResponse<TutorEstudianteResponse[]>> {
        return this.http.get<ApiResponse<TutorEstudianteResponse[]>>(`${this.base}/estudiantes/${idEstudiante}/tutores`);
    }

    // ─── Inscripciones ───────────────────────────────────────────────────────
    listarInscripciones(): Observable<ApiResponse<InscripcionResponse[]>> {
        return this.http.get<ApiResponse<InscripcionResponse[]>>(`${this.base}/inscripciones`);
    }
    crearInscripcion(body: InscripcionRequest): Observable<ApiResponse<InscripcionResponse>> {
        return this.http.post<ApiResponse<InscripcionResponse>>(`${this.base}/inscripciones`, body);
    }
    eliminarInscripcion(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/inscripciones/${id}`);
    }

    // ─── Asignaciones Docentes ───────────────────────────────────────────────
    listarAsignaciones(): Observable<ApiResponse<AsignacionDocenteResponse[]>> {
        return this.http.get<ApiResponse<AsignacionDocenteResponse[]>>(`${this.base}/asignaciones`);
    }
    crearAsignacion(body: AsignacionDocenteRequest): Observable<ApiResponse<AsignacionDocenteResponse>> {
        return this.http.post<ApiResponse<AsignacionDocenteResponse>>(`${this.base}/asignaciones`, body);
    }
    eliminarAsignacion(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/asignaciones/${id}`);
    }
}
