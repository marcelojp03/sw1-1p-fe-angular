export interface ApiResponse<T> {
    codigo: number;
    mensaje: string;
    data: T;
}
