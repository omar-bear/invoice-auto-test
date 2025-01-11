'use client';

import { useState, useRef, useEffect } from 'react';
import writtenNumber from 'written-number';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Building2, Phone, FileText, Building } from 'lucide-react';
import { logo } from '@/components/logo';

const LOGO_BASE64 = logo; // Votre image encodée

// =======================================
// Configuration de 'written-number' en français
// =======================================
writtenNumber.defaults.lang = 'fr';

export default function GenerateurFacturesHtml() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Fixed Company Information
  const companyInfo = {
    name: 'SOCIETE BEN KEBLI SERVICE',
    fullName: 'Services Electromécaniques & Industriels',
    address: 'Rue Nabeul Z.I. Mghuira 3',
    phone: '22 398 057 / 55 398 057',
    nif: '1889188X/A/M 000',
    additionalInfo: 'REBOBINAGE',
    email: 'BenKebliservice@gmail.com',
  };

  // Client Information
  const [includeClientInfo, setIncludeClientInfo] = useState(false);
  const [nomClient, setNomClient] = useState('');
  const [adresseClient, setAdresseClient] = useState('');
  const [nifClient, setNifClient] = useState('');

  // Invoice Details
  const [numeroFacture, setNumeroFacture] = useState('');
  const [dateFacture, setDateFacture] = useState('');
  const [services, setServices] = useState([
    { nom: '', quantite: '', prixUnitaire: '', tva: '19' },
  ]);

  // Ref vers la zone HTML à convertir en PDF
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Au premier chargement, on récupère le dernier numéro de facture stocké
  useEffect(() => {
    const lastInvoiceNumber = localStorage.getItem('lastInvoiceNumber') || '0';
    setNumeroFacture(
      (parseInt(lastInvoiceNumber) + 1).toString().padStart(4, '0')
    );
    setDateFacture(new Date().toISOString().split('T')[0]);

    // Synchronisation connexion admin
    const storedIsLoggedIn = localStorage.getItem('is-logged-in') === 'true';
    if (storedIsLoggedIn !== isLoggedIn) {
      setIsLoggedIn(storedIsLoggedIn);
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    if (username.toLowerCase() === 'dali' && password === '123456') {
      setIsLoggedIn(true);
      localStorage.setItem('is-logged-in', 'true');
    } else {
      alert('Identifiants incorrects');
    }
  };

  const ajouterService = () => {
    setServices((prev) => [
      ...prev,
      { nom: '', quantite: '', prixUnitaire: '', tva: '19' },
    ]);
  };

  const supprimerService = (index: number) => {
    const nouveauxServices = services.filter((_, i) => i !== index);
    setServices(nouveauxServices);
  };

  const mettreAJourService = (
    index: number,
    champ: 'nom' | 'quantite' | 'prixUnitaire' | 'tva',
    valeur: string
  ) => {
    const nouveauxServices = [...services];
    nouveauxServices[index][champ] = valeur;
    setServices(nouveauxServices);
  };

  // ===============================
  // Calcul des montants totaux
  // ===============================
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} DT`;
    // On met 3 décimales pour afficher les millimes si besoin
  };

  const totalHT = services.reduce((sum, service) => {
    const quantity = parseFloat(service.quantite) || 0;
    const unitPrice = parseFloat(service.prixUnitaire) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  const totalTVA = services.reduce((sum, service) => {
    const quantity = parseFloat(service.quantite) || 0;
    const unitPrice = parseFloat(service.prixUnitaire) || 0;
    const tvaRate = parseFloat(service.tva) || 0;
    return sum + (quantity * unitPrice * tvaRate) / 100;
  }, 0);

  // Total TTC (sans timbre)
  const totalTTC = totalHT + totalTVA;

  // Timbre : 1 DT
  const timbre = 1;
  // Total TTC + Timbre
  const totalAvecTimbre = totalTTC + timbre;

  // ===============================
  // Conversion du total TTC + Timbre en lettres
  // ===============================
  // Exemple : 125.750 => "cent vingt-cinq dinars et sept cent cinquante millimes"
  const totalGlobal = parseFloat(totalAvecTimbre.toFixed(3)); // Arrondi à 3 décimales
  const partieEntiere = Math.floor(totalGlobal); // Ex: 125
  const millimes = Math.round((totalGlobal - partieEntiere) * 1000); // Ex: 0.750 * 1000 = 750

  // Convertir la partie entière en lettres
  const partieEntiereEnLettres = writtenNumber(partieEntiere);
  // Convertir la partie millimes en lettres (si > 0)
  const millimesEnLettres = millimes > 0 ? writtenNumber(millimes) : null;

  // Construire la phrase finale
  let totalGlobalEnLettres = '';
  if (millimesEnLettres) {
    totalGlobalEnLettres = `${partieEntiereEnLettres} dinars et ${millimesEnLettres} millimes`;
  } else {
    totalGlobalEnLettres = `${partieEntiereEnLettres} dinars`;
  }

  // ===============================
  // Génération du PDF à partir du HTML
  // ===============================
  const genererPDF = async () => {
    const html2pdff = (await import('html2pdf.js/dist/html2pdf.min.js'))
      .default;

    // Ajout de styles pour un meilleur rendu PDF
    const styles = `
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
  
        /* Container principal (marges) */
        .pdf-container {
          padding: 20px;
        }
  
        /* 
          Header global : 
          3 colonnes avec flex 
        */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
  
        /* Colonne gauche = Info Entreprise */
        .company-info {
          width: 30%;
          font-size: 11px;
        }
        .company-info h2 {
          font-size: 14px;
          margin-bottom: 8px;
          color: #222;
        }
        .company-info p {
          margin: 4px 0;
        }
  
        /* Colonne centre = Titre Facture + Logo */
        .facture-center {
          width: 40%;
          text-align: center;
        }
        .facture-center img {
          display: block;
          margin: 0 auto 5px auto; 
          max-width: 100px;
        }
        .facture-center h1 {
          font-size: 20px;
          margin: 5px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .facture-center h2 {
          font-size: 12px;
          margin: 2px 0;
          font-weight: normal;
          color: #666;
        }
        .facture-center p {
          margin: 2px 0;
          font-size: 10px;
        }
  
        /* Colonne droite = Numéro Facture + Date */
        .invoice-info {
          width: 30%;
          text-align: right;
        }
        .invoice-info h2 {
          font-size: 16px;
          margin: 5px 0;
          text-transform: uppercase;
        }
        .invoice-info p {
          margin: 2px 0;
          font-size: 12px;
        }
  
        /* 
          Section Infos Client 
          (en dessous du gros header) 
        */
        .client-section {
          margin-top: 20px;
        }
        .client-section h3 {
          font-size: 13px;
          margin-bottom: 5px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 3px;
          color: #444;
        }
        .client-section p {
          margin: 4px 0;
          font-size: 11px;
        }
  
        /* Tableau des services & Totaux */
        .section {
          margin: 20px 0;
        }
        .section h2 {
          font-size: 14px;
          margin-bottom: 10px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          color: #444;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th, .table td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
          font-size: 11px;
        }
        .table thead {
          background-color: #f5f5f5;
        }
  
        .totals {
          text-align: right;
          margin-top: 20px;
          font-size: 12px;
        }
        .totals div {
          margin-bottom: 5px;
        }
        .totals strong {
          font-weight: bold;
        }
  
        footer {
          text-align: center;
          font-size: 10px;
          margin-top: 20px;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }
      </style>
    `;

    // Insertion du contenu (HTML) à convertir en PDF
    const content = `
      ${styles}
      <div class="pdf-container">
  
        <!-- ============================
             Header en 3 colonnes
        ============================= -->
        <div class="invoice-header">
          <!-- 1/3 : Infos Entreprise -->
          <div class="company-info">
            <h2>${companyInfo.name}</h2>
            <p><strong>${companyInfo.fullName}</strong></p>
            <p>${companyInfo.additionalInfo}</p>
            <p><strong>Adresse :</strong> ${companyInfo.address}</p>
            <p><strong>Tél :</strong> ${companyInfo.phone}</p>
            <p><strong>Email :</strong> ${companyInfo.email}</p>
            <p><strong>Matricule Fiscal :</strong> ${companyInfo.nif}</p>
            <hr style="margin:10px 0"/>
          </div>
  
          <!-- 2/3 : Titre + Logo -->
          <div class="facture-center">
            <img src="${LOGO_BASE64}" alt="Logo" />
            <h1>Facture</h1>
            <h2>${companyInfo.fullName}</h2>
            <p>${companyInfo.additionalInfo}</p>
          </div>
  
          <!-- 3/3 : Facture N° + Date -->
          <div class="invoice-info">
            <h2>Facture N°: ${numeroFacture}</h2>
            <p><strong>Date :</strong> ${dateFacture}</p>
          </div>
        </div>
  
        <!-- ============================
             Infos du Client (en dessous)
        ============================= -->
        ${
          includeClientInfo
            ? `
              <div class="client-section">
                <h3>Informations du Client</h3>
                <p><strong>Client :</strong> ${nomClient}</p>
                <p><strong>Adresse :</strong> ${adresseClient}</p>
                ${nifClient ? `<p><strong>NIF :</strong> ${nifClient}</p>` : ''}
              </div>
            `
            : ''
        }
  
        <!-- ============================
             Tableau des services
        ============================= -->
        <div class="section">
          <h2>Détails des Services</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Quantité</th>
                <th>Prix HTVA</th>
                <th>TVA (%)</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${services
                .map((service) => {
                  const quantity = parseFloat(service.quantite) || 0;
                  const unitPrice = parseFloat(service.prixUnitaire) || 0;
                  const tvaRate = parseFloat(service.tva) || 0;
                  const totalHT = quantity * unitPrice;

                  return `
                    <tr>
                      <td>${service.nom}</td>
                      <td>${quantity}</td>
                      <td>${unitPrice.toFixed(3)} DT</td>
                      <td>${tvaRate}%</td>
                      <td>${totalHT.toFixed(3)} DT</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
  
        <!-- ============================
             Totaux
        ============================= -->
        <div class="totals">
          <div><strong>Total HT:</strong> ${totalHT.toFixed(3)} DT</div>
          <div><strong>Total TVA:</strong> ${totalTVA.toFixed(3)} DT</div>
          <div><strong>Total TTC:</strong> ${totalTTC.toFixed(3)} DT</div>
          <div><strong>Timbre:</strong> 1.000 DT</div>
          <div><strong>Total TTC + Timbre:</strong> ${totalAvecTimbre.toFixed(
            3
          )} DT</div>
          <div><strong>Total en lettres:</strong> ${totalGlobalEnLettres}</div>
        </div>
  
        <!-- ============================
             Footer
        ============================= -->
        <footer>
          <p>Merci pour votre confiance!</p>
        </footer>
  
      </div>
    `;

    // Options PDF
    const options = {
      margin: 10,
      filename: `facture_${numeroFacture}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    // Générer le PDF
    const element = document.createElement('div');
    element.innerHTML = content;
    html2pdff().set(options).from(element).save();

    // Sauvegarde du numéro de facture
    localStorage.setItem('lastInvoiceNumber', numeroFacture);
  };

  // ===============================
  // Affichage du formulaire de connexion si pas connecté
  // ===============================
  if (!isLoggedIn) {
    return (
      <div className='container mx-auto p-4'>
        <Card>
          <CardHeader>
            <CardTitle>Connexion Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='username'>Nom d&apos;utilisateur</Label>
                <Input
                  id='username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='password'>Mot de passe</Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleLogin}>Se connecter</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ===============================
  // Affichage principal
  // ===============================
  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-6 text-center text-primary'>
        Générateur de Factures
      </h1>

      <div ref={invoiceRef} className='bg-white p-6 shadow-lg rounded-md'>
        {/* =========================
            Infos entreprise 
        ==========================*/}
        <Card className='mb-6 bg-white shadow-none border-0'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-2xl'>
                Informations de l&apos;entreprise
              </CardTitle>
              <img
                src='https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-company-NT5ZvVcuDfePS5Jj9vIRnNuxt9oZx4.jpeg'
                alt='BEN KEBLI S.E.I Logo'
                className='h-20 w-auto'
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='flex items-center gap-3'>
                <Building2 className='h-5 w-5' />
                <div>
                  <h3 className='font-semibold'>{companyInfo.name}</h3>
                  <p className='text-sm'>{companyInfo.fullName}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Building className='h-5 w-5' />
                <div>
                  <h3 className='font-semibold'>Adresse</h3>
                  <p className='text-sm'>{companyInfo.address}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Phone className='h-5 w-5' />
                <div>
                  <h3 className='font-semibold'>Téléphone</h3>
                  <p className='text-sm'>{companyInfo.phone}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <FileText className='h-5 w-5' />
                <div>
                  <h3 className='font-semibold'>Matricule Fiscal</h3>
                  <p className='text-sm'>{companyInfo.nif}</p>
                </div>
              </div>

              {/* <div className='border-t border-gray-200 pt-4'>
                <h3 className='font-semibold mb-2'>Coordonnées Bancaires</h3>
                <div className='grid gap-1 text-sm'>
                  <p>
                    <span className='font-medium'>Banque:</span>{' '}
                    {companyInfo.bankName}
                  </p>
                  <p>
                    <span className='font-medium'>RIB:</span> {companyInfo.rib}
                  </p>
                  <p>
                    <span className='font-medium'>Agence:</span>{' '}
                    {companyInfo.bankBranch}
                  </p>
                </div>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* =========================
            Infos client
        ==========================*/}
        {includeClientInfo && (
          <Card className='mb-6 bg-white shadow-none border-0'>
            <CardHeader>
              <CardTitle className='text-xl text-primary'>
                Informations sur le client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-1 text-sm mb-4'>
                <h3 className='font-semibold'>
                  Nom du Client / Raison sociale
                </h3>
                <p>{nomClient}</p>
                <h3 className='font-semibold mt-2'>Adresse</h3>
                <p>{adresseClient}</p>
                {nifClient && (
                  <>
                    <h3 className='font-semibold mt-2'>NIF</h3>
                    <p>{nifClient}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* =========================
            Détails Facture
        ==========================*/}
        <Card className='mb-4 bg-white shadow-none border-0'>
          <CardHeader>
            <CardTitle className='text-xl text-primary'>
              Détails de la facture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between text-sm'>
              <div>
                <p className='font-semibold'>Facture N°: {numeroFacture}</p>
              </div>
              <div>
                <p className='font-semibold'>Date: {dateFacture}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================
            Tableau des services
        ==========================*/}
        <Table className='text-sm'>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              <TableHead>Service</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Prix unitaire HT</TableHead>
              <TableHead>TVA (%)</TableHead>
              <TableHead>Total HT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service, index) => {
              const quantity = parseFloat(service.quantite) || 0;
              const unitPrice = parseFloat(service.prixUnitaire) || 0;
              const tvaRate = parseFloat(service.tva) || 0;
              const totalServiceHT = quantity * unitPrice;

              return (
                <TableRow key={index}>
                  <TableCell>{service.nom}</TableCell>
                  <TableCell>{quantity}</TableCell>
                  <TableCell>{formatCurrency(unitPrice)}</TableCell>
                  <TableCell>{tvaRate}%</TableCell>
                  <TableCell>{formatCurrency(totalServiceHT)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* =========================
            Totaux
        ==========================*/}
        <div className='mt-4 flex flex-col items-end space-y-1 text-sm'>
          <div>
            <span className='font-semibold'>Total HT : </span>
            {formatCurrency(totalHT)}
          </div>
          <div>
            <span className='font-semibold'>Total TVA : </span>
            {formatCurrency(totalTVA)}
          </div>
          <div>
            <span className='font-semibold'>Total TTC : </span>
            {formatCurrency(totalTTC)}
          </div>
          <div>
            <span className='font-semibold'>Timbre : </span>
            {formatCurrency(timbre)}
          </div>
          <div>
            <span className='font-semibold'>Total TTC + Timbre : </span>
            {formatCurrency(totalTTC + timbre)}
          </div>
          <div className='mt-2 text-sm italic text-gray-700'>
            <span className='font-semibold'>En toutes lettres : </span>
            {totalGlobalEnLettres}
          </div>
        </div>
      </div>

      {/* =========================
          Contrôles d'édition 
          (Reste du code inchangé)
      ==========================*/}
      <Card className='mt-6 shadow-md'>
        <CardHeader>
          <CardTitle className='text-xl text-primary'>
            Paramètres / Édition Facture
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='includeClientInfo'
              checked={includeClientInfo}
              onCheckedChange={(checked) =>
                setIncludeClientInfo(checked as boolean)
              }
            />
            <Label htmlFor='includeClientInfo' className='cursor-pointer'>
              Inclure les informations du client
            </Label>
          </div>

          {includeClientInfo && (
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='nomClient'>Nom / Raison sociale</Label>
                <Input
                  id='nomClient'
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='nifClient'>NIF</Label>
                <Input
                  id='nifClient'
                  value={nifClient}
                  onChange={(e) => setNifClient(e.target.value)}
                />
              </div>
              <div className='md:col-span-2 grid gap-2'>
                <Label htmlFor='adresseClient'>Adresse</Label>
                <Textarea
                  id='adresseClient'
                  value={adresseClient}
                  onChange={(e) => setAdresseClient(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='numeroFacture'>Numéro de facture</Label>
              <Input
                id='numeroFacture'
                value={numeroFacture}
                onChange={(e) => setNumeroFacture(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='dateFacture'>Date de facture</Label>
              <Input
                id='dateFacture'
                type='date'
                value={dateFacture}
                onChange={(e) => setDateFacture(e.target.value)}
              />
            </div>
          </div>

          <div
            className='border p-3 rounded-md'
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <Label className='font-semibold mb-2 block'>Services</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix HTVA (DT)</TableHead>
                  <TableHead>TVA (%)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={service.nom}
                        onChange={(e) =>
                          mettreAJourService(index, 'nom', e.target.value)
                        }
                        placeholder='Nom du service'
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={service.quantite}
                        onChange={(e) =>
                          mettreAJourService(index, 'quantite', e.target.value)
                        }
                        placeholder='Quantité'
                        type='number'
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={service.prixUnitaire}
                        onChange={(e) =>
                          mettreAJourService(
                            index,
                            'prixUnitaire',
                            e.target.value
                          )
                        }
                        placeholder='Prix unitaire HT'
                        type='number'
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={service.tva}
                        onChange={(e) =>
                          mettreAJourService(index, 'tva', e.target.value)
                        }
                        placeholder='TVA'
                        type='number'
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='destructive'
                        size='icon'
                        onClick={() => supprimerService(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              onClick={ajouterService}
              className='mt-2'
              style={{ alignSelf: 'flex-end' }}
            >
              Ajouter un service
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={genererPDF}
            className='w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105'
          >
            Générer la facture PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
