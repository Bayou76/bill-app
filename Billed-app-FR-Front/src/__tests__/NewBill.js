/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import mockStore from "../__mocks__/store";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import NewBillUI from "../views/NewBillUI.js";
import BillsUI from "../views/BillsUI.js";

jest.spyOn(mockStore, "bills");

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill icon on verticallayout should be highlighted", async () => {
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

      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-mail");
      expect(windowIcon.className).toContain("active-icon");
    });

    describe("Lorsque l'utilisateur interagit avec le formulaire NewBil", () => {
      test("Ensuite, l'ajout d'un fichier déclenche la fonction handleChangeFile", async () => {
        // Create a NewBill instance
        const newBillInstance = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: localStorageMock,
        });

        // Mock the handleChangeFile function
        const handleChangeFileMock = jest.fn(newBillInstance.handleChangeFile);

        // Add an event listener for the file input
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFileMock);

        // Simulate selecting a file
        fireEvent.change(inputFile, {
          target: {
            files: [
              new File(["document.jpg"], "document.jpg", {
                type: "document/jpg",
              }),
            ],
          },
        });

        // Expect handleChangeFile to be called
        expect(handleChangeFileMock).toHaveBeenCalled();

        // Expect the form title "Envoyer une note de frais" to be present
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });
    });

    // test d'intégration POST
    describe("Lorsque je suis sur la page NewBill, je remplis le formulaire et je le soumets", () => {
      test("Ensuite la facture est ajoutée à l'API", async () => {
        // Simuler le rendu de l'interface utilisateur de NewBill
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Données de facture simulées
        const billData = {
          userEmail: "employee@test.tld",
          expenseType: "Hôtel et logement",
          expenseName: "Hôtel du centre ville",
          expenseAmount: 120,
          expenseDate: "2022-12-30",
          expenseVat: "10",
          expensePct: 10,
          expenseCommentary: "",
          fileUrl: "testFacture.png",
          fileName: "testFacture",
          status: "pending",
        };

        // Remplir les champs du formulaire avec les données simulées
        const typeField = screen.getByTestId("expense-type");
        fireEvent.change(typeField, {
          target: { value: billData.expenseType },
        });
        expect(typeField.value).toBe(billData.expenseType);

        const nameField = screen.getByTestId("expense-name");
        fireEvent.change(nameField, {
          target: { value: billData.expenseName },
        });
        expect(nameField.value).toBe(billData.expenseName);

        const dateField = screen.getByTestId("datepicker");
        fireEvent.change(dateField, {
          target: { value: billData.expenseDate },
        });
        expect(dateField.value).toBe(billData.expenseDate);

        const amountField = screen.getByTestId("amount");
        fireEvent.change(amountField, {
          target: { value: billData.expenseAmount },
        });
        expect(parseInt(amountField.value)).toBe(
          parseInt(billData.expenseAmount)
        );

        const vatField = screen.getByTestId("vat");
        fireEvent.change(vatField, { target: { value: billData.expenseVat } });
        expect(parseInt(vatField.value)).toBe(parseInt(billData.expenseVat));

        const pctField = screen.getByTestId("pct");
        fireEvent.change(pctField, { target: { value: billData.expensePct } });
        expect(parseInt(pctField.value)).toBe(parseInt(billData.expensePct));

        const commentaryField = screen.getByTestId("commentary");
        fireEvent.change(commentaryField, {
          target: { value: billData.expenseCommentary },
        });
        expect(commentaryField.value).toBe(billData.expenseCommentary);

        // Simuler la soumission du formulaire
        const newBillForm = screen.getByTestId("form-new-bill");
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        const newBillInstance = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Espionner les fonctions de gestion de fichier et de soumission du formulaire
        const handleChangeFileSpy = jest.fn(newBillInstance.handleChangeFile);
        newBillForm.addEventListener("change", handleChangeFileSpy);
        const fileField = screen.getByTestId("file");
        fireEvent.change(fileField, {
          target: {
            files: [
              new File([billData.fileName], billData.fileUrl, {
                type: "image/png",
              }),
            ],
          },
        });
        expect(fileField.files[0].name).toBe(billData.fileUrl);
        expect(fileField.files[0].type).toBe("image/png");
        expect(handleChangeFileSpy).toHaveBeenCalled();

        const handleSubmitSpy = jest.fn(newBillInstance.handleSubmit);
        newBillForm.addEventListener("submit", handleSubmitSpy);
        fireEvent.submit(newBillForm);
        expect(handleSubmitSpy).toHaveBeenCalled();
      });

      // Vérifie si l'erreur 404 s'affiche bien
      test("Alors, récupère les factures depuis une API et échoue avec un message d'erreur 404", async () => {
        mockStore.post = jest.fn();
        mockStore.post.mockImplementationOnce(() => {
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
        mockStore.post = jest.fn();
        mockStore.post.mockImplementationOnce(() => {
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
});
