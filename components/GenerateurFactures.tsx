'use client';

import { useState, useEffect } from 'react';
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
import {
  Trash2,
  Building2,
  Phone,
  FileText,
  Building,
  CreditCard,
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function GenerateurFactures() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Fixed Company Information
  const companyInfo = {
    name: 'STE BEN KEBLI S.E.I',
    fullName: 'Services Electromécaniques & Industriels',
    address: 'MGHRIA 3, FOUCHANA',
    phone: '22 398 057 / 55 398 057',
    nif: '1690910/V/A/M/000',
    bankName: "Banque de l'Habitat",
    rib: '1406706710700131366',
    bankBranch: 'MGHRIA',
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

  useEffect(() => {
    const lastInvoiceNumber = localStorage.getItem('lastInvoiceNumber') || '0';
    setNumeroFacture(
      (parseInt(lastInvoiceNumber) + 1).toString().padStart(4, '0')
    );
    setDateFacture(new Date().toISOString().split('T')[0]);

    // **Ajouter cette partie pour synchroniser isLoggedIn avec localStorage**
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (storedIsLoggedIn !== isLoggedIn) {
      setIsLoggedIn(storedIsLoggedIn);
    }
  }, []);

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      alert('Identifiants incorrects');
    }
  };

  const ajouterService = () => {
    setServices([
      ...services,
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

  const genererPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

    const formatCurrency = (amount: number) => {
      return `${amount.toFixed(2)} DT`;
    };

    pdf.setFont('helvetica');

    // **Ajout d'une bordure autour de la page**
    pdf.setDrawColor(0);
    pdf.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);

    // **Position initiale Y**
    let yPos = margin + 10;

    // **Logo en haut à gauche**
    const logoWidth = 40;
    const logoHeight = 40;
    pdf.addImage(
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-company-NT5ZvVcuDfePS5Jj9vIRnNuxt9oZx4.jpeg',
      'JPEG',
      margin + 2,
      margin + 2,
      logoWidth,
      logoHeight
    );

    // **En-tête de la facture**
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FACTURE', pageWidth - margin + 4, margin, {
      align: 'right',
    });

    // **Informations de l'entreprise à droite du logo**
    const companyInfoX = margin + logoWidth + 10;
    yPos = margin + 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, companyInfoX, yPos);
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(companyInfo.fullName, companyInfoX, yPos);
    yPos += 8;
    pdf.text(companyInfo.address, companyInfoX, yPos);
    yPos += 8;
    pdf.text(`Tél: ${companyInfo.phone}`, companyInfoX, yPos);
    yPos += 8;
    pdf.text(`NIF: ${companyInfo.nif}`, companyInfoX, yPos);

    // **Avancer yPos pour le bloc suivant**
    yPos += 15;

    // **Informations bancaires avec hauteur dynamique du rectangle**
    const bankInfoYStart = yPos;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Informations Bancaires', pageWidth / 2, yPos, {
      align: 'center',
    });
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Banque: ${companyInfo.bankName}`, margin + 10, yPos);
    yPos += 8;
    pdf.text(`RIB: ${companyInfo.rib}`, margin + 10, yPos);
    yPos += 8;
    pdf.text(`Agence: ${companyInfo.bankBranch}`, margin + 10, yPos);

    // **Calculer la hauteur et dessiner le rectangle des informations bancaires**
    const bankInfoHeight = yPos - bankInfoYStart + 10;
    pdf.rect(
      margin,
      bankInfoYStart - 5,
      pageWidth - 2 * margin,
      bankInfoHeight
    );

    // **Avancer yPos pour le bloc suivant**
    yPos += 15;

    // **Détails de la facture (numéro et date) avec hauteur dynamique du rectangle**
    const detailsYStart = yPos;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`Facture N°: ${numeroFacture}`, margin + 10, yPos + 3);
    pdf.text(`Date: ${dateFacture}`, pageWidth - margin - 10, yPos + 3, {
      align: 'right',
    });
    yPos += 8;

    // **Calculer la hauteur et dessiner le rectangle des détails de la facture**
    const detailsHeight = yPos - detailsYStart + 5;
    pdf.rect(margin, detailsYStart - 5, pageWidth - 2 * margin, detailsHeight);

    // **Avancer yPos pour le bloc suivant**
    yPos += 10;

    // **Informations du client avec hauteur dynamique du rectangle**
    if (includeClientInfo) {
      const clientInfoYStart = yPos;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Client:', margin + 10, yPos);
      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(nomClient, margin + 10, yPos);
      yPos += 8;
      pdf.text(adresseClient, margin + 10, yPos);
      if (nifClient) {
        yPos += 8;
        pdf.text(`NIF: ${nifClient}`, margin + 10, yPos);
      }

      // **Calculer la hauteur et dessiner le rectangle des informations du client**
      const clientInfoHeight = yPos - clientInfoYStart + 10;
      pdf.rect(
        margin,
        clientInfoYStart - 5,
        pageWidth - 2 * margin,
        clientInfoHeight
      );

      // **Avancer yPos pour le bloc suivant**
      yPos += 15;
    }

    // **Tableau des services avec bordure**
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const tableYStart = yPos;
    const tableWidth = pageWidth - 2 * margin;
    const colWidths = [
      tableWidth * 0.35,
      tableWidth * 0.15,
      tableWidth * 0.2,
      tableWidth * 0.1,
      tableWidth * 0.2,
    ];
    const headers = ['Service', 'Quantité', 'Prix HTVA', 'TVA', 'Total HT'];

    // **Dessiner les en-têtes du tableau avec bordures**
    let currentX = margin;
    let rowY = tableYStart;

    // **Vérifier si les en-têtes tiennent sur la page, sinon ajouter une nouvelle page**
    if (rowY + 10 > pageHeight - margin) {
      pdf.addPage();
      rowY = margin;
    }

    headers.forEach((header, index) => {
      pdf.rect(currentX, rowY, colWidths[index], 10);
      pdf.text(header, currentX + 2, rowY + 7, { align: 'left' });
      currentX += colWidths[index];
    });

    rowY += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    services.forEach((service) => {
      let serviceX = margin;
      const quantity = parseFloat(service.quantite) || 0;
      const unitPrice = parseFloat(service.prixUnitaire) || 0;
      const tvaRate = parseFloat(service.tva) || 0;
      const totalHT = quantity * unitPrice;

      const values = [
        pdf.splitTextToSize(service.nom, colWidths[0] - 4),
        quantity.toString(),
        formatCurrency(unitPrice),
        `${tvaRate}%`,
        formatCurrency(totalHT),
      ];

      let maxHeight = 10;
      if (Array.isArray(values[0])) {
        const textHeight = values[0].length * 5;
        maxHeight = Math.max(maxHeight, textHeight);
      }

      // **Vérifier si la prochaine ligne tient sur la page, sinon ajouter une nouvelle page**
      if (rowY + maxHeight > pageHeight - margin) {
        pdf.addPage();
        rowY = margin;

        // **Redessiner les en-têtes du tableau sur la nouvelle page**
        currentX = margin;
        headers.forEach((header, index) => {
          pdf.rect(currentX, rowY, colWidths[index], 10);
          pdf.text(header, currentX + 2, rowY + 7, { align: 'left' });
          currentX += colWidths[index];
        });
        rowY += 10;
      }

      // **Dessiner les cellules du tableau**
      for (let i = 0; i < values.length; i++) {
        pdf.rect(serviceX, rowY, colWidths[i], maxHeight);
        pdf.text(values[i], serviceX + 2, rowY + 5, { align: 'left' });
        serviceX += colWidths[i];
      }

      rowY += maxHeight;
    });

    // **Calcul des totaux**
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

    const totalTTC = totalHT + totalTVA;

    // **Affichage des totaux sous le tableau avec bordure**
    rowY += 10;
    const totalWidth = 80;
    const totalX = pageWidth - margin - totalWidth;

    // **Vérifier si les totaux tiennent sur la page, sinon ajouter une nouvelle page**
    if (rowY + 30 > pageHeight - margin) {
      pdf.addPage();
      rowY = margin;
    }

    pdf.rect(totalX, rowY, totalWidth, 30);

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total HT:`, totalX + 2, rowY + 8);
    pdf.text(formatCurrency(totalHT), totalX + totalWidth - 2, rowY + 8, {
      align: 'right',
    });
    pdf.text(`Total TVA:`, totalX + 2, rowY + 16);
    pdf.text(formatCurrency(totalTVA), totalX + totalWidth - 2, rowY + 16, {
      align: 'right',
    });
    pdf.text(`Total TTC:`, totalX + 2, rowY + 24);
    pdf.text(formatCurrency(totalTTC), totalX + totalWidth - 2, rowY + 24, {
      align: 'right',
    });

    // **Pied de page**
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(
      'Merci pour votre confiance!',
      pageWidth / 2,
      pageHeight - margin,
      { align: 'center' }
    );

    // **Enregistrer le PDF**
    pdf.save(`facture_${numeroFacture}.pdf`);
    localStorage.setItem('lastInvoiceNumber', numeroFacture);
  };

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

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-6 text-center text-primary'>
        Générateur de Factures
      </h1>

      <Card className='mb-6 bg-white shadow-lg border-2'>
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

            <div className='border-t border-gray-200 pt-4'>
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='mb-6 shadow-md'>
        <CardHeader>
          <CardTitle className='text-xl text-primary'>
            Informations sur le client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-2 mb-4'>
            <Checkbox
              id='includeClientInfo'
              checked={includeClientInfo}
              onCheckedChange={(checked) =>
                setIncludeClientInfo(checked as boolean)
              }
            />
            <Label htmlFor='includeClientInfo'>
              Inclure les informations du client
            </Label>
          </div>
          {includeClientInfo && (
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='nomClient'>Nom ou raison sociale</Label>
                <Input
                  id='nomClient'
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='adresseClient'>Adresse complète</Label>
                <Textarea
                  id='adresseClient'
                  value={adresseClient}
                  onChange={(e) => setAdresseClient(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='nifClient'>
                  Numéro d&apos;Identification Fiscale (si applicable)
                </Label>
                <Input
                  id='nifClient'
                  value={nifClient}
                  onChange={(e) => setNifClient(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='mb-6 shadow-md'>
        <CardHeader>
          <CardTitle className='text-xl text-primary'>
            Détails de la facture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='numeroFacture'>Numéro de facture</Label>
              <Input
                id='numeroFacture'
                value={numeroFacture}
                readOnly
                className='bg-gray-100'
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
        </CardContent>
      </Card>

      <Card className='mb-6 shadow-md'>
        <CardHeader>
          <CardTitle className='text-xl text-primary'>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix unitaire HT (DT)</TableHead>
                <TableHead>TVA (%)</TableHead>
                <TableHead>Action</TableHead>
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
        </CardContent>
        <CardFooter>
          <Button onClick={ajouterService} className='w-full'>
            Ajouter un service
          </Button>
        </CardFooter>
      </Card>

      <Button
        onClick={genererPDF}
        className='w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105'
      >
        Générer la facture PDF
      </Button>
    </div>
  );
}
