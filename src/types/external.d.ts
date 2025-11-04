declare module "pako" {
    export function ungzip(data: Uint8Array): Uint8Array;
}

declare module "js-untar" {
    export interface UntarFile {
        name: string;
        buffer: Uint8Array;
    }
    export default function untar(
        arrayBuffer: ArrayBuffer,
    ): Promise<UntarFile[]>;
}
