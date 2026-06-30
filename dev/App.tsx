import CreateAMolecule from '@src/CreateAMolecule';
import './index.css';

export default function App() {
  return (
    <div class="min-h-screen bg-aidu-page p-6">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">
          Create a Molecule Dev Sandbox
        </h1>

        <div class="bg-white shadow p-4">
          <CreateAMolecule />
        </div>
      </div>
    </div>
  );
}
