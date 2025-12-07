import { minikitConfig } from "../../../minikit.config";

export async function GET() {
  const manifest = {
    accountAssociation: minikitConfig.accountAssociation,
    baseBuilder: minikitConfig.baseBuilder,
    miniapp: minikitConfig.miniapp,
  };
  
  return Response.json(manifest);
}
