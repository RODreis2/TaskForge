export type TreeRow =
  | {
      kind: 'folder';
      id: string;
      name: string;
      prefix: string;
      expanded: boolean;
      selected: boolean;
      matched: boolean;
    }
  | {
      kind: 'task';
      id: string;
      title: string;
      folderId: string | null;
      prefix: string;
      active: boolean;
      matched: boolean;
    };

export type Stroke = {
  color: string;
  width: number;
  points: Array<[number, number]>;
};

export type WorkspaceBlock = {
  id: string;
  type: 'TEXT' | 'DRAW';
  orderIndex: number;
  textContent: string;
  drawingData: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorkspaceImage = {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorkspaceDocumentBlock = {
  x: number;
  y: number;
  width: number;
  height: number;
  textContent?: string;
  drawingData?: string;
};

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export type TreeContextMenuState =
  | {
      open: false;
      x: 0;
      y: 0;
      target: null;
      targetId: null;
      targetFolderId: null;
    }
  | {
      open: true;
      x: number;
      y: number;
      target: 'folder' | 'task' | 'blank';
      targetId: string | null;
      targetFolderId: string | null;
    };
