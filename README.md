<!--
Copyright 2024 Google LLC

Licensed under the MIT License;
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      https://www.mit.edu/~amini/LICENSE.md

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<img align="left" width="150" src="https://services.google.com/fh/files/misc/vigenair_logo.png" alt="ViGenAiR Logo" /><br>

# ViGenAiR - Recrafting Video Ads with Generative AI

[![GitHub last commit](https://img.shields.io/github/last-commit/google-marketing-solutions/vigenair)](https://github.com/google-marketing-solutions/vigenair/commits)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

**Disclaimer: This is not an official Google product.**

[Overview](#overview) •
[Get started](#get-started) •
[What it solves](#challenges) •
[How it works](#solution-overview) •
[How to Contribute](#how-to-contribute)

## Updates

* [May 2024]: Launch! 🚀

## Overview

**ViGenAiR** *(pronounced vision-air)* uses state-of-the-art multimodal Generative AI on Google Cloud Platform (GCP) to automatically repurpose long-form Video Ads and generate several shorter variants and storylines at scale. It generates horizontal, vertical and square assets to power [Demand Gen](https://support.google.com/google-ads/answer/13695777?hl=en) and [YouTube video campaigns](https://support.google.com/youtube/answer/2375497?hl=en), and leverages A/B testing to automatically identify the best variants tailored to your target audiences. ViGenAiR is an acronym for <u>Vi</u>deo <u>Gen</u>eration via <u>A</u>ds <u>R</u>ecrafting, and is more colloquially referred to as vigenair.

## Get Started

tbd

## Challenges

Current Video Ads creative solutions, both within YouTube / Google Ads as well as open source, primarily focus on 4 of the [5 keys to effective advertising](https://info.ncsolutions.com/hubfs/2023%20Five%20Keys%20to%20Advertising%20Effectiveness/NCS_Five_Keys_to_Advertising_Effectiveness_E-Book_08-23.pdf) - Brand, Targeting, Reach and Recency. Those 4 pillars contribute to *only ~50%* of the potential marketing ROI, with the 5th pillar - **Creative** - capturing a *whopping ~50%* all on its own.

<center><img src='./img/creative.png' alt='The importance of Creatives for effective adverising' /></center>

Vigenair focuses on the *Creative* pillar to help potentially **unlock ~50% ROI** while solving a huge pain point for advertisers; the generation, trafficking and A/B testing of different Video Ad formats, at **scale**, powered by Google's multimodal Generative AI - Gemini.

## Solution Overview

Vigenair's frontend is an Angular Progressive Web App (PWA) hosted on Google Apps Script and accessible via a [web app deployment](https://developers.google.com/apps-script/guides/web). As with all Google Workspace apps, users must authenticate with a Google account in order to use the vigenair web app. Backend services are hosted on [Cloud Functions 2nd gen](https://cloud.google.com/functions/docs/concepts/version-comparison), and are triggered via Cloud Storage (GCS). Decoupling the UI and core services via GCS significantly reduces authentication overhead and effectively implements separation of concerns between the frontend and backend layers.

Vigenair uses Gemini on Vertex AI to *holistically* understand and analyse the content and storyline of a Video Ad, **automatically** splitting it into *coherent* audio/video segments that are then used to generate different shorter variants and Ad formats. Vigenair analyses the spoken dialogue in a video (if present), the visually changing shots, on-screen entities such as any identified logos and/or text, and background music and effects. It then uses all of this information to combine sections of the video together that are *coherent*; segments that won't be cut mid-dialogue nor mid-scene, and that are semantically and contextually related to one another. These coherent A/V segments serve as the building blocks for both GenAI- and user-driven recombination.

<center><img src='./img/overview.png' alt='How vigenair works' /></center>

The generated variants may follow the original Ad's storyline - and thus serve as *mid-funnel reminder campaigns* of the original Ad for **Awareness and/or Consideration** - or introduce whole new storylines altogether, all while following Google's best practices for creatives.

### Architecture

The diagram below shows how vigenair's components interact and communicate with one another.

<center><img src='./img/architecture.png' alt='Vigenair Architecture' /></center>

1. Users upload or select videos they have previously analysed via the UI (step #2 is skipped for already analysed videos).
2. New uploads into GCS trigger the Extractor Service, which extracts all video information and stores the results on GCS (`input.vtt`, `analysis.json` and `data.json`).
3. The UI continuously queries GCS for updates while showing a preview of the uploaded video.
    * Once the `input.vtt` is available, a transcription track is embedded onto the video preview.
    * Once the `analysis.json` is available, [object tracking](https://cloud.google.com/video-intelligence/docs/object-tracking) results are displayed as bounding boxes directly on the video preview.
    * Once the `data.json` is available, the extracted A/V Segments are displayed along with a set of user controls.
4. Users can generate and iterate on variants via a storyboard preview while modifying controls, adding desired variants to the render queue.
5. Once users are satisfied with the resulting variants, they can render them in their desired formats and settings via the Combiner Service (writing `render.json` to GCS, which serves as the input to the service, and the output is a `combos.json`).
6. The UI continuously queries GCS for updates. Once a `combos.json` is available, the final videos of the variants and all associated assets will be displayed. Users can then approve the final variants they would like to upload into Google Ads / YouTube.

### Requirements

You need the following to use and deploy vigenair:

* Google account: required to access the vigenair UI.
* GCP project with:
  * The [Vertex AI API](https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/api-quickstart) enabled: required to access Gemini in Vertex AI.
    * All users running Vigenair must be granted the [Vertex AI User](https://cloud.google.com/vertex-ai/docs/general/access-control#aiplatform.user) role on the associated GCP project.
  * The [Video AI API](https://cloud.google.com/video-intelligence) enabled: required for analysing input videos.
* The Vigenair setup and deployment script will create the following components
  * A Google Cloud Storage (GCS) bucket named <code>*<gcp_project_id>*-vigenair</code>
  * A Cloud Function named `vigenair` that fulfills both the Extractor and Combiner Services. Refer to [deploy.sh](./service/deploy.sh) for specs.
  * An Apps Script deployment for the frontend web app.

## How to Contribute

Beyond the information outlined in our [Contributing Guide](CONTRIBUTING.md), you would need to follow these additional steps to build vigenair locally:

### Build and Deploy Cloud Functions

1. Navigate to the directory where the source code lives and run `cd ./service`
1. Run `./deploy.sh` to build and deploy the vigenair Cloud Function.

### Build and Serve the Angular UI

1. Make sure your system has an up-to-date installation of [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
1. Navigate to the directory where the source code lives and run `cd ./ui`
1. Run `npm install`.
1. Run `npx @google/aside init` and click through the prompts.
   * Input the Apps Script `Script ID` associated with your target Google Sheets spreadsheet. You can find out this value by clicking on `Extensions > Apps Script` in the top navigation menu of your target sheet, then navigating to `Project Settings` (the gear icon) in the resulting [Apps Script](https://script.google.com) view.
1. Run `npm run deploy` to build, test and deploy (via [clasp](https://github.com/google/clasp)) all UI and Apps Script code to the target spreadsheet / Apps Script project.
1. Run `ng serve` to launch the UI locally with Hot Module Replacement (HMR) during development.
