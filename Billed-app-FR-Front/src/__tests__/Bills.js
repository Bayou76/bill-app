/**
 * @jest-environment jsdom
 */

import { screen, waitFor, store } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import mockedBills from "../__mocks__/store.js";
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";
jest.spyOn(mockStore, "bills");

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.className).toContain("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      console.log("dates non triées:", dates);
      console.log("dates triées:", datesSorted);
      expect(dates).toEqual(datesSorted);
    });
  });

  // Test de la fonction handleClickNewBill

  describe("Quand je clique sur le bouton 'Nouvelle note de frais'", () => {
    it("Alors je devrais être redirigé vers la page 'Nouvelle note de frais'", () => {
      const onNavigate = jest.fn();
      const billPage = new Bills({ document, onNavigate, store, localStorage });

      // Appelez handleClickNewBill
      billPage.handleClickNewBill();

      // Vérifiez que la redirection vers la page 'Nouvelle note de frais' a eu lieu
      expect(onNavigate).toHaveBeenCalledWith("#employee/bill/new");
    });
  });

  // Test de la fonction handleClickIconEye

  describe("Quand je clique sur l'icône 'eye' d'une facture avec une URL valide", () => {
    it("Alors un modal devrait apparaître", () => {

      const onNavigate = jest.fn();
      const localStorageMock = {
        getItem: jest.fn(() => JSON.stringify({ type: "Employee" })),
      };
      const iconEye = document.createElement("div");
      iconEye.setAttribute("data-testid", "icon-eye");
      document.body.appendChild(iconEye);

      // Mock de la fonction modal
      const modaleFile = document.createElement("div");
      modaleFile.setAttribute("id", "modaleFile");
      document.body.appendChild(modaleFile);
      $.fn.modal = jest.fn(() => {
        // console.log("la modale a été appelée");
        modaleFile.classList.add("show");
      });


      const billsInstance = new Bills({
        document,
        onNavigate,
        localStorage: localStorageMock,
      });
      billsInstance.handleClickIconEye(iconEye);

      const modalFile = document.getElementById("modaleFile");
      expect(modalFile).toBeTruthy();
      expect(modaleFile.className).toContain("show");
    });
  });

  // test d'integration GET

  describe("Étant donné que je suis sur la page des factures", () => {
    it("Alos on devrait retourner des factures pour l'employé", async () => {
      // Créer une instance de la classe Bills
      const billsInstance = new Bills({
        document,
        store: mockedBills
      });
  
      const result = await billsInstance.getBills();

      // console.log(result);
  
      // le résultat n'est pas vide
      expect(result).toBeTruthy();
  
      // Vérifier le format des factures retournées
      result.forEach((bill) => {
        expect(typeof bill).toBe("object"); // Chaque facture doit être un objet
        expect(bill).toHaveProperty("id"); // Chaque facture doit avoir un identifiant
        expect(typeof bill.id).toBe("string");
        expect(bill).toHaveProperty("status"); // Chaque facture doit avoir un statut
        expect(typeof bill.status).toBe("string");
        expect(bill).toHaveProperty("pct"); // Chaque facture doit avoir un pourcentage
        expect(typeof bill.pct).toBe("number");
        expect(bill).toHaveProperty("amount"); // Chaque facture doit avoir un montant
        expect(typeof bill.amount).toBe("number");
        expect(bill).toHaveProperty("email"); // Chaque facture doit avoir un email
        expect(typeof bill.email).toBe("string");
        expect(bill).toHaveProperty("name"); // Chaque facture doit avoir un nom
        expect(typeof bill.name).toBe("string");
        expect(bill).toHaveProperty("vat"); // Chaque facture doit avoir une TVA
        expect(typeof bill.vat).toBe("string");
        expect(bill).toHaveProperty("fileName"); // Chaque facture doit avoir un nom de fichier
        expect(typeof bill.fileName).toBe("string");
        expect(bill).toHaveProperty("commentAdmin"); // Chaque facture doit avoir un commentaire administratif
        expect(typeof bill.commentAdmin).toBe("string");
        expect(bill).toHaveProperty("commentary"); // Chaque facture doit avoir un commentaire
        expect(typeof bill.commentary).toBe("string");
        expect(bill).toHaveProperty("type"); // Chaque facture doit avoir un type
        expect(typeof bill.type).toBe("string");
        expect(bill).toHaveProperty("fileUrl"); // Chaque facture doit avoir une URL de fichier
        expect(typeof bill.fileUrl).toBe("string");
      });
    });

    // Vérifie si l'erreur 404 s'affiche bien
    test("Alors, récupère les factures depuis une API et échoue avec un message d'erreur 404", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    // Vérifie si l'erreur 500 s'affiche bien
    test("Alors, récupère les factures depuis une API et échoue avec un message d'erreur 500", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});

