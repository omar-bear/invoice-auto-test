'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'

export default function GenerateurFactures() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  // Informations sur l'entreprise
  const [logo, setLogo] = useState<string | null>(null)
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [adresseEntreprise, setAdresseEntreprise] = useState('')
  const [nif, setNif] = useState('')
  const [rc, setRc] = useState('')
  const [nae, setNae] = useState('')
  
  // Informations sur le client
  const [includeClientInfo, setIncludeClientInfo] = useState(false)
  const [nomClient, setNomClient] = useState('')
  const [adresseClient, setAdresseClient] = useState('')
  const [nifClient, setNifClient] = useState('')
  
  // Détails de la facture
  const [numeroFacture, setNumeroFacture] = useState('')
  const [dateFacture, setDateFacture] = useState('')
  const [services, setServices] = useState([{ nom: '', quantite: '', prixUnitaire: '', tva: '19' }])
  
  // Informations supplémentaires
  const [coordonneesBancaires, setCoordonneesBancaires] = useState('')
  const [contactServiceClient, setContactServiceClient] = useState('')

  useEffect(() => {
    const lastInvoiceNumber = localStorage.getItem('lastInvoiceNumber') || '0'
    setNumeroFacture((parseInt(lastInvoiceNumber) + 1).toString().padStart(4, '0'))

    // Charger les informations de l'entreprise depuis le localStorage
    const storedLogo = localStorage.getItem('logoImage')
    if (storedLogo) setLogo(storedLogo)
    setNomEntreprise(localStorage.getItem('nomEntreprise') || '')
    setAdresseEntreprise(localStorage.getItem('adresseEntreprise') || '')
    setNif(localStorage.getItem('nif') || '')
    setRc(localStorage.getItem('rc') || '')
    setNae(localStorage.getItem('nae') || '')
    setCoordonneesBancaires(localStorage.getItem('coordonneesBancaires') || '')
    setContactServiceClient(localStorage.getItem('contactServiceClient') || '')
  }, [])

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true)
    } else {
      alert('Identifiants incorrects')
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setLogo(base64String)
        localStorage.setItem('logoImage', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveCompanyInfo = () => {
    localStorage.setItem('nomEntreprise', nomEntreprise)
    localStorage.setItem('adresseEntreprise', adresseEntreprise)
    localStorage.setItem('nif', nif)
    localStorage.setItem('rc', rc)
    localStorage.setItem('nae', nae)
    localStorage.setItem('coordonneesBancaires', coordonneesBancaires)
    localStorage.setItem('contactServiceClient', contactServiceClient)
  }

  const ajouterService = () => {
    setServices([...services, { nom: '', quantite: '', prixUnitaire: '', tva: '19' }])
  }

  const supprimerService = (index: number) => {
    const nouveauxServices = services.filter((_, i) => i !== index)
    setServices(nouveauxServices)
  }

  const mettreAJourService = (index: number, champ: 'nom' | 'quantite' | 'prixUnitaire' | 'tva', valeur: string) => {
    const nouveauxServices = [...services]
    nouveauxServices[index][champ] = valeur
    setServices(nouveauxServices)
  }

  const genererPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

    // Fonction pour ajouter un rectangle noir
    const addBlackRectangle = (y: number, height: number) => {
      pdf.setFillColor(0);
      pdf.rect(0, y, pageWidth, height, 'F');
    };

    // En-tête
    addBlackRectangle(0, 40);
    pdf.setTextColor(255);
    pdf.setFontSize(24);
    pdf.text("FACTURE", margin, 30);

    // Logo et informations de l'entreprise
    let yPos = 50;
    if (logo) {
      pdf.addImage(logo, 'JPEG', pageWidth - 60, yPos, 40, 40);
    }
    pdf.setTextColor(0);
    pdf.setFontSize(12);
    pdf.text(nomEntreprise, margin, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    pdf.text(adresseEntreprise, margin, yPos);
    yPos += 10;
    if (nif) pdf.text(`NIF: ${nif}`, margin, yPos);
    yPos += 10;
    if (rc) pdf.text(`RC: ${rc}`, margin, yPos);
    yPos += 10;
    if (nae) pdf.text(`NAE: ${nae}`, margin, yPos);

    // Informations du client
    if (includeClientInfo) {
      yPos += 20;
      addBlackRectangle(yPos, 20);
      pdf.setTextColor(255);
      pdf.setFontSize(12);
      pdf.text("Client:", margin, yPos + 14);
      yPos += 25;
      pdf.setTextColor(0);
      pdf.setFontSize(10);
      pdf.text(nomClient, margin, yPos);
      yPos += 10;
      pdf.text(adresseClient, margin, yPos);
      yPos += 10;
      if (nifClient) pdf.text(`NIF: ${nifClient}`, margin, yPos);
    }

    // Détails de la facture
    yPos += 20;
    pdf.setFontSize(12);
    pdf.text(`Facture N°: ${numeroFacture}`, margin, yPos);
    yPos += 10;
    pdf.text(`Date: ${dateFacture}`, margin, yPos);

    // Tableau des services
    yPos += 20;
    const tableTop = yPos;
    const tableHeaders = ["Service", "Quantité", "Prix unitaire HT", "TVA", "Total HT"];
    const tableData = services.map(service => [
      service.nom,
      service.quantite,
      service.prixUnitaire,
      `${service.tva}%`,
      (parseFloat(service.quantite) * parseFloat(service.prixUnitaire)).toFixed(2)
    ]);

    addBlackRectangle(tableTop, 10);
    pdf.setTextColor(255);
    pdf.setFontSize(10);
    tableHeaders.forEach((header, index) => {
      pdf.text(header, margin + 5 + (index * ((pageWidth - 2 * margin) / 5)), tableTop + 7);
    });

    yPos = tableTop + 15;
    pdf.setTextColor(0);
    tableData.forEach((row, index) => {
      row.forEach((cell, cellIndex) => {
        pdf.text(cell.toString(), margin + 5 + (cellIndex * ((pageWidth - 2 * margin) / 5)), yPos);
      });
      yPos += 10;
      if (index < tableData.length - 1) {
        pdf.setDrawColor(200);
        pdf.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
      }
    });

    // Totaux
    const totalHT = services.reduce((sum, service) => sum + (parseFloat(service.quantite) * parseFloat(service.prixUnitaire)), 0);
    const totalTVA = services.reduce((sum, service) => sum + (parseFloat(service.quantite) * parseFloat(service.prixUnitaire) * parseFloat(service.tva) / 100), 0);
    const totalTTC = totalHT + totalTVA;

    yPos += 20;
    addBlackRectangle(yPos, 40);
    pdf.setTextColor(255);
    pdf.setFontSize(12);
    pdf.text("Total HT:", pageWidth - margin - 60, yPos + 10);
    pdf.text(`${totalHT.toFixed(2)} DT`, pageWidth - margin - 5, yPos + 10, { align: 'right' });
    pdf.text("Total TVA:", pageWidth - margin - 60, yPos + 20);
    pdf.text(`${totalTVA.toFixed(2)} DT`, pageWidth - margin - 5, yPos + 20, { align: 'right' });
    pdf.text("Total TTC:", pageWidth - margin - 60, yPos + 30);
    pdf.text(`${totalTTC.toFixed(2)} DT`, pageWidth - margin - 5, yPos + 30, { align: 'right' });

    // Informations supplémentaires
    yPos = pageHeight - 40;
    pdf.setTextColor(0);
    pdf.setFontSize(8);
    if (coordonneesBancaires) pdf.text(`Coordonnées bancaires: ${coordonneesBancaires}`, margin, yPos);
    yPos += 10;
    if (contactServiceClient) pdf.text(`Contact service client: ${contactServiceClient}`, margin, yPos);

    // Pied de page
    addBlackRectangle(pageHeight - 20, 20);
    pdf.setTextColor(255);
    pdf.setFontSize(8);
    pdf.text("Merci pour votre confiance!", margin, pageHeight - 10);

    // Sauvegarder le PDF
    pdf.save(`facture_${numeroFacture}.pdf`);

    // Incrémenter et sauvegarder le numéro de facture
    localStorage.setItem('lastInvoiceNumber', numeroFacture);
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Connexion Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleLogin}>Se connecter</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Générateur de Factures</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Informations sur votre entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo</Label>
              <Input id="logo" type="file" onChange={handleLogoUpload} />
              {logo && <img src={logo} alt="Logo de l'entreprise" className="mt-2 max-w-xs" />}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nomEntreprise">Nom ou raison sociale</Label>
              <Input id="nomEntreprise" value={nomEntreprise} onChange={(e) => setNomEntreprise(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adresseEntreprise">Adresse complète</Label>
              <Textarea id="adresseEntreprise" value={adresseEntreprise} onChange={(e) => setAdresseEntreprise(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nif">Numéro d&apos;Identification Fiscale (NIF)</Label>
              <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rc">Numéro du Registre de Commerce (RC)</Label>
              <Input id="rc" value={rc} onChange={(e) => setRc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nae">Code d&apos;activité économique (NAE)</Label>
              <Input id="nae" value={nae} onChange={(e) => setNae(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveCompanyInfo}>Enregistrer les informations de l&apos;entreprise</Button>
        </CardFooter>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Informations sur le client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox id="includeClientInfo" checked={includeClientInfo} onCheckedChange={(checked) => setIncludeClientInfo(checked as boolean)} />
            <Label htmlFor="includeClientInfo">Inclure les informations du client</Label>
          </div>
          {includeClientInfo && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nomClient">Nom ou raison sociale</Label>
                <Input id="nomClient" value={nomClient} onChange={(e) => setNomClient(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adresseClient">Adresse complète</Label>
                <Textarea id="adresseClient" value={adresseClient} onChange={(e) => setAdresseClient(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nifClient">Numéro d&apos;Identification Fiscale (si applicable)</Label>
                <Input id="nifClient" value={nifClient} onChange={(e) => setNifClient(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Détails de la facture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="numeroFacture">Numéro de facture</Label>
              <Input id="numeroFacture" value={numeroFacture} readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateFacture">Date de facture</Label>
              <Input id="dateFacture" type="date" value={dateFacture} onChange={(e) => setDateFacture(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Services</CardTitle>
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
                      onChange={(e) => mettreAJourService(index, 'nom', e.target.value)}
                      placeholder="Nom du service"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={service.quantite} 
                      onChange={(e) => mettreAJourService(index, 'quantite', e.target.value)}
                      placeholder="Quantité"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={service.prixUnitaire} 
                      onChange={(e) => mettreAJourService(index, 'prixUnitaire', e.target.value)}
                      placeholder="Prix unitaire HT"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={service.tva} 
                      onChange={(e) => mettreAJourService(index, 'tva', e.target.value)}
                      placeholder="TVA"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="icon" onClick={() => supprimerService(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button onClick={ajouterService}>Ajouter un service</Button>
        </CardFooter>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Informations supplémentaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="coordonneesBancaires">Coordonnées bancaires</Label>
              <Input id="coordonneesBancaires" value={coordonneesBancaires} onChange={(e) => setCoordonneesBancaires(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactServiceClient">Contact du service client</Label>
              <Input id="contactServiceClient" value={contactServiceClient} onChange={(e) => setContactServiceClient(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={genererPDF} className="w-full">Générer la facture PDF</Button>
    </div>
  )
}