export interface AssistantToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  requiredPermissions: string[];
}

export interface CellManifest {
  name: string;
  version: string;
  description: string;
  routes: Array<{ method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; permission: string }>;
  permissions: string[];
  events: string[];
  assistantTools: AssistantToolDefinition[];
}

class SpineRegistry {
  private cells: Map<string, CellManifest> = new Map();

  public registerCell(manifest: CellManifest): void {
    this.cells.set(manifest.name, manifest);
  }

  public getCell(name: string): CellManifest | undefined {
    return this.cells.get(name);
  }

  public getAllCells(): readonly CellManifest[] {
    return Array.from(this.cells.values());
  }

  public getAssistantTools(): AssistantToolDefinition[] {
    const tools: AssistantToolDefinition[] = [];
    for (const cell of this.cells.values()) {
      tools.push(...cell.assistantTools);
    }
    return tools;
  }

  public getAllTools(): AssistantToolDefinition[] {
    return this.getAssistantTools();
  }
}

export const spineRegistry = new SpineRegistry();
