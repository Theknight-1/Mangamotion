"use client";

import useSWR from "swr";
import { Plus, Trash2 } from "lucide-react";
import { storyboardApi, swrKeys } from "@/lib/api";
import { Button } from "@/components/loader-button";
import type { ShotType, CameraAngle } from "@/types/storyboard";

const SHOT_TYPES: ShotType[] = ["wide", "close-up", "action", "reaction", "establishing"];
const CAMERA_ANGLES: CameraAngle[] = [
  "eye-level",
  "low-angle",
  "high-angle",
  "over-the-shoulder",
  "dutch-angle",
];

interface Props {
  projectId: string;
}

export function ShotListPanel({ projectId }: Props) {
  const { data, mutate } = useSWR(
    swrKeys.storyboardShots(projectId),
    () => storyboardApi.listShots(projectId),
    { revalidateOnFocus: false },
  );
  const shots = data?.shots ?? [];

  async function handleAdd() {
    await storyboardApi.createShot(projectId, { description: "" });
    mutate();
  }

  async function handleUpdate(id: string, patch: Record<string, any>) {
    // Optimistic-ish: just refetch after PATCH resolves. Kept simple —
    // this is a low-frequency editing surface, not the drag-heavy board.
    await storyboardApi.updateShot(id, patch);
    mutate();
  }

  async function handleDelete(id: string) {
    await storyboardApi.deleteShot(id);
    mutate();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02] text-left text-xs text-white/40">
              <th className="w-10 px-3 py-2">#</th>
              <th className="px-3 py-2">Description</th>
              <th className="w-32 px-3 py-2">Shot type</th>
              <th className="w-36 px-3 py-2">Camera angle</th>
              <th className="px-3 py-2">Draft narration</th>
              <th className="w-20 px-3 py-2">Sec</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {shots.map((shot, i) => (
              <tr key={shot.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-3 py-2 text-white/30">{i + 1}</td>
                <td className="px-2 py-1.5">
                  <input
                    defaultValue={shot.description}
                    onBlur={(e) =>
                      e.target.value !== shot.description &&
                      handleUpdate(shot.id, { description: e.target.value })
                    }
                    className="w-full rounded-md bg-transparent px-2 py-1 text-white/90 hover:bg-white/[0.03] focus:bg-white/[0.05] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    defaultValue={shot.shotType ?? ""}
                    onChange={(e) => handleUpdate(shot.id, { shotType: e.target.value || null })}
                    className="w-full rounded-md bg-transparent px-1 py-1 text-white/70 focus:outline-none"
                  >
                    <option value="">—</option>
                    {SHOT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <select
                    defaultValue={shot.cameraAngle ?? ""}
                    onChange={(e) => handleUpdate(shot.id, { cameraAngle: e.target.value || null })}
                    className="w-full rounded-md bg-transparent px-1 py-1 text-white/70 focus:outline-none"
                  >
                    <option value="">—</option>
                    {CAMERA_ANGLES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    defaultValue={shot.draftNarration ?? ""}
                    onBlur={(e) =>
                      e.target.value !== (shot.draftNarration ?? "") &&
                      handleUpdate(shot.id, { draftNarration: e.target.value })
                    }
                    className="w-full rounded-md bg-transparent px-2 py-1 text-white/70 hover:bg-white/[0.03] focus:bg-white/[0.05] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={1}
                    defaultValue={shot.estDuration ?? 3}
                    onBlur={(e) =>
                      Number(e.target.value) !== (shot.estDuration ?? 3) &&
                      handleUpdate(shot.id, { estDuration: Number(e.target.value) })
                    }
                    className="w-full rounded-md bg-transparent px-2 py-1 text-white/70 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => handleDelete(shot.id)}
                    className="text-white/20 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="secondary" leftIcon={<Plus size={14} />} onClick={handleAdd}>
        Add shot
      </Button>
    </div>
  );
}
