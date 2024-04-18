/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CONFIG } from './config';
import { AppLogger } from './logging';
import { StorageManager } from './storage';
import { VertexHelper } from './vertex';

export interface AvSegment {
  av_segment_id: number;
  description: string;
  visual_segment_ids: number[];
  audio_segment_ids: number[];
  start_s: number;
  end_s: number;
  duration_s: number;
  transcript: string[];
  labels: string[];
  objects: string[];
  text: string[];
  logos: string[];
  details: string[];
  keywords: string;
}

export interface GenerationSettings {
  prompt: string;
  duration: string;
  demandGenAssets: boolean;
}

export interface GenerateVariantsResponse {
  combo_id: number;
  title: string;
  scenes: number[];
  description: string;
  score: number;
  reasoning: string;
}

export class GenerationHelper {
  static resolveGenerationPrompt(
    gcsFolder: string,
    settings: GenerationSettings
  ): string {
    const videoLanguage = StorageManager.loadFile(
      `${gcsFolder}/language.txt`,
      true
    ) as string;
    const duration = Number(settings.duration) || 30;
    const expectedDurationRange =
      GenerationHelper.calculateExpectedDurationRange(duration);
    const videoScript = GenerationHelper.createVideoScript(gcsFolder);

    const generationPrompt = CONFIG.vertexAi.generationPrompt
      .replace('{{userPrompt}}', settings.prompt)
      .replace('{{desiredDuration}}', String(duration))
      .replace('{{expectedDurationRange}}', expectedDurationRange)
      .replace('{{videoLanguage}}', videoLanguage)
      .replace('{{videoScript}}', videoScript);

    return generationPrompt;
  }

  static calculateExpectedDurationRange(duration: number): string {
    const durationFraction = 20 / 100;
    const expectedDurationRange = `${duration - duration * durationFraction}-${duration + duration * durationFraction}`;

    return expectedDurationRange;
  }

  static createVideoScript(gcsFolder: string): string {
    const avSegments = JSON.parse(
      StorageManager.loadFile(`${gcsFolder}/data.json`, true) as string
    ) as AvSegment[];
    const videoScript: string[] = [];

    avSegments.forEach((avSegment, index) => {
      videoScript.push(`Scene ${index + 1}`);
      videoScript.push(`${avSegment.start_s} --> ${avSegment.end_s}`);
      videoScript.push(
        `Duration: ${(avSegment.end_s - avSegment.start_s).toFixed(2)}s`
      );
      const description = avSegment.description.trim();
      if (description) {
        videoScript.push(`Description: ${description}`);
      }
      videoScript.push(
        `Number of visual shots: ${avSegment.visual_segment_ids.length}`
      );
      const transcript = avSegment.transcript;
      const details = avSegment.labels.concat(avSegment.objects);
      const text = avSegment.text.map((t: string) => `"${t}"`);
      const logos = avSegment.logos;
      const keywords = avSegment.keywords.trim();

      if (transcript) {
        videoScript.push(`Off-screen speech: "${transcript.join(' ')}"`);
      }
      if (details) {
        videoScript.push(`On-screen details: ${details.join(', ')}`);
      }
      if (text) {
        videoScript.push(`On-screen text: ${text.join(', ')}`);
      }
      if (logos) {
        videoScript.push(`Logos: ${logos.join(', ')}`);
      }
      if (keywords) {
        videoScript.push(`Keywords: ${keywords}`);
      }
      videoScript.push('');
    });
    return videoScript.join('\n');
  }

  static generateVariants(gcsFolder: string, settings: GenerationSettings) {
    const prompt = GenerationHelper.resolveGenerationPrompt(
      gcsFolder,
      settings
    );
    const variants: GenerateVariantsResponse[] = [];
    let iteration = 0;

    while (!variants.length) {
      iteration++;
      const response = VertexHelper.generate(prompt);
      AppLogger.info(`GenerateVariants Response #${iteration}: ${response}`);

      const results = response.split('\n\n\n');
      const regex =
        /.*Title:\**(?<title>.*)\n+\**Scenes:\**(?<scenes>.*)\n+\**Reasoning:\**(?<description>.*)\n+\**Score:\**(?<score>.*)\n+\**ABCD:\**\n+(?<reasoning>[\w\W\s\S\d\D]*)/ms;

      results.forEach((result, index) => {
        const matches = result.match(regex);
        if (matches) {
          const { title, scenes, description, score, reasoning } =
            matches.groups as {
              title: string;
              scenes: string;
              description: string;
              score: string;
              reasoning: string;
            };
          const variant: GenerateVariantsResponse = {
            combo_id: index + 1,
            title: String(title).trim(),
            scenes: String(scenes)
              .trim()
              .split(', ')
              .filter(Boolean)
              .map(scene => Number(scene)),
            description: String(description).trim(),
            score: Number(String(score).trim()),
            reasoning: String(reasoning).trim(),
          };
          variants.push(variant);
        } else {
          AppLogger.warn(
            `WARNING - Received an incomplete response for iteration #${iteration} from the API!`
          );
        }
      });
    }
    return variants;
  }
}