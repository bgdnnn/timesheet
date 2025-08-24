// src/api/integrations.js
import { client } from "./timesheetClient";

export const Core = client.integrations.Core;
export const InvokeLLM = client.integrations.Core.InvokeLLM;
export const SendEmail = client.integrations.Core.SendEmail;
export const UploadFile = client.integrations.Core.UploadFile;
export const GenerateImage = client.integrations.Core.GenerateImage;
export const ExtractDataFromUploadedFile =
  client.integrations.Core.ExtractDataFromUploadedFile;
