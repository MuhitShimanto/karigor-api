import path from 'path';
import YAML from 'yamljs';

const specPath = path.join(process.cwd(), 'docs/openapi.yaml');
const swaggerSpec = YAML.load(specPath);

export default swaggerSpec;
